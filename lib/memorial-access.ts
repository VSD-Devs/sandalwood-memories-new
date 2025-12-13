import { supabase } from "@/lib/database"

type AccessState = "public" | "owner" | "collaborator" | "approved" | "pending" | "declined" | "none" | "unauthenticated"

export interface MemorialAccessResult {
  memorialId: string
  memorialSlug?: string | null
  isPublic: boolean
  canView: boolean
  isOwner: boolean
  isCollaborator: boolean
  accessStatus: AccessState
  requestStatus: "pending" | "approved" | "declined" | null
}

async function loadMemorialCore(id: string) {
  const { data, error } = await supabase
    .from("memorials")
    .select("id, slug, created_by, is_public, status")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("Memorial access fetch error:", error)
  }

  return data
}

async function loadMemorialCoreBySlug(slug: string) {
  const { data, error } = await supabase
    .from("memorials")
    .select("id, slug, created_by, is_public, status")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    console.error("Memorial access fetch error:", error)
  }

  return data
}

async function loadCollaboratorFlag(memorialId: string, userId?: string | null): Promise<boolean> {
  if (!userId) return false

  const { data, error } = await supabase
    .from("memorial_collaborators")
    .select("id")
    .eq("memorial_id", memorialId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Collaborator lookup error:", error)
  }

  return Boolean(data?.id)
}

async function loadAccessRequestStatus(memorialId: string, userId?: string | null): Promise<"pending" | "approved" | "declined" | null> {
  if (!userId) return null

  const { data, error } = await supabase
    .from("memorial_access_requests")
    .select("status")
    .eq("memorial_id", memorialId)
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false })
    .maybeSingle()

  if (error) {
    console.error("Access request lookup error:", error)
  }

  const status = (data?.status || "") as string
  return status === "approved" || status === "pending" || status === "declined" ? status : null
}

function buildAccessResult(params: {
  memorialId: string
  memorialSlug?: string | null
  isPublic: boolean
  userId?: string | null
  isOwner: boolean
  isCollaborator: boolean
  requestStatus: "pending" | "approved" | "declined" | null
}): MemorialAccessResult {
  const { memorialId, memorialSlug, isPublic, userId, isOwner, isCollaborator, requestStatus } = params

  const canView = isPublic || isOwner || isCollaborator || requestStatus === "approved"

  const accessStatus: AccessState = isOwner
    ? "owner"
    : isCollaborator
      ? "collaborator"
      : isPublic
        ? "public"
        : requestStatus || (userId ? "none" : "unauthenticated")

  return {
    memorialId,
    memorialSlug,
    isPublic,
    canView,
    isOwner,
    isCollaborator,
    accessStatus,
    requestStatus,
  }
}

export async function getMemorialAccess(memorialId: string, userId?: string | null): Promise<MemorialAccessResult | null> {
  const memorial = await loadMemorialCore(memorialId)
  if (!memorial) return null

  const isOwner = !!userId && String(memorial.created_by) === String(userId)
  const isCollaborator = await loadCollaboratorFlag(memorial.id, userId)
  const requestStatus = await loadAccessRequestStatus(memorial.id, userId)

  return buildAccessResult({
    memorialId: memorial.id,
    memorialSlug: memorial.slug,
    isPublic: !!memorial.is_public,
    userId,
    isOwner,
    isCollaborator,
    requestStatus,
  })
}

export async function getMemorialAccessBySlug(slug: string, userId?: string | null): Promise<MemorialAccessResult | null> {
  const memorial = await loadMemorialCoreBySlug(slug)
  if (!memorial) return null

  const isOwner = !!userId && String(memorial.created_by) === String(userId)
  const isCollaborator = await loadCollaboratorFlag(memorial.id, userId)
  const requestStatus = await loadAccessRequestStatus(memorial.id, userId)

  return buildAccessResult({
    memorialId: memorial.id,
    memorialSlug: memorial.slug,
    isPublic: !!memorial.is_public,
    userId,
    isOwner,
    isCollaborator,
    requestStatus,
  })
}

export async function requireMemorialOwner(memorialId: string, userId: string): Promise<void> {
  const access = await getMemorialAccess(memorialId, userId)
  if (!access?.isOwner) {
    throw new Error("Memorial ownership required")
  }
}

export interface CreateAccessRequestInput {
  memorialId: string
  requesterUserId?: string | null
  requesterEmail?: string | null
  requesterName?: string | null
  message?: string | null
}

export async function createAccessRequest(input: CreateAccessRequestInput) {
  const { memorialId, requesterUserId, requesterEmail, requesterName, message } = input

  const memorial = await loadMemorialCore(memorialId)
  if (!memorial) {
    throw new Error("Memorial not found")
  }

  if (memorial.is_public) {
    return { status: "public" as const, canView: true }
  }

  if (requesterUserId && (String(memorial.created_by) === String(requesterUserId) || String(memorial.owner_user_id || "") === String(requesterUserId))) {
    return { status: "owner" as const, canView: true }
  }

  if (!requesterUserId && !requesterEmail) {
    throw new Error("An email address is required to request access")
  }

  const collaborator = await loadCollaboratorFlag(memorialId, requesterUserId)
  if (collaborator) {
    return { status: "collaborator" as const, canView: true }
  }

  const existingForUser = requesterUserId
    ? await supabase
        .from("memorial_access_requests")
        .select("id, status")
        .eq("memorial_id", memorialId)
        .eq("requester_user_id", requesterUserId)
        .order("created_at", { ascending: false })
        .maybeSingle()
    : null

  const existingForEmail =
    !requesterUserId && requesterEmail
      ? await supabase
          .from("memorial_access_requests")
          .select("id, status")
          .eq("memorial_id", memorialId)
          .eq("requester_email", requesterEmail)
          .order("created_at", { ascending: false })
          .maybeSingle()
      : null

  const existing = existingForUser?.data || existingForEmail?.data
  const existingStatus = (existing?.status || "") as string

  if (existing && existingStatus === "approved") {
    return { status: "approved" as const, requestId: existing.id, already: true }
  }

  if (existing && existingStatus === "pending") {
    return { status: "pending" as const, requestId: existing.id, already: true }
  }

  if (existing && existingStatus === "declined") {
    const { data, error } = await supabase
      .from("memorial_access_requests")
      .update({
        status: "pending",
        message: message || existing?.message || null,
        requester_name: requesterName || existing?.requester_name || null,
        requester_email: requesterEmail || existing?.requester_email || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, status")
      .maybeSingle()

    if (error || !data) {
      console.error("Failed to resubmit access request:", error)
      throw new Error("Failed to resubmit request")
    }

    return { status: "pending" as const, requestId: data.id, already: true }
  }

  const { data, error } = await supabase
    .from("memorial_access_requests")
    .insert({
      memorial_id: memorialId,
      requester_user_id: requesterUserId || null,
      requester_email: requesterEmail || null,
      requester_name: requesterName || null,
      message: message || null,
      status: "pending",
    })
    .select("id, status")
    .maybeSingle()

  if (error || !data) {
    console.error("Failed to create access request:", error)
    throw new Error("Failed to create access request")
  }

  return { status: data.status as "pending", requestId: data.id, already: false }
}

export async function getAccessRequestsForOwner(memorialId: string, ownerId: string) {
  await requireMemorialOwner(memorialId, ownerId)

  const { data, error } = await supabase
    .from("memorial_access_requests")
    .select("id, requester_user_id, requester_email, requester_name, message, status, created_at, updated_at, decided_at, decided_by")
    .eq("memorial_id", memorialId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to load access requests:", error)
    throw new Error("Failed to load access requests")
  }

  return data || []
}

export async function setAccessRequestStatus(memorialId: string, ownerId: string, requestId: string, status: "approved" | "declined") {
  await requireMemorialOwner(memorialId, ownerId)

  const { data, error } = await supabase
    .from("memorial_access_requests")
    .update({
      status,
      decided_by: ownerId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("memorial_id", memorialId)
    .select("id, status")
    .maybeSingle()

  if (error || !data) {
    console.error("Failed to update access request:", error)
    throw new Error("Failed to update access request")
  }

  return data
}




