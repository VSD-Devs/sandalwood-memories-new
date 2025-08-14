import { neon } from "@neondatabase/serverless"

function getSql() {
  const rawCandidates = [process.env.DATABASE_URL, process.env.POSTGRES_URL, process.env.DATABASE_URL_UNPOOLED]
  const candidates = rawCandidates
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .map((v) => v!.trim().replace(/^postgres:\/\//, "postgresql://"))
  for (const url of candidates) {
    try {
      return neon(url)
    } catch {}
  }
  throw new Error("DATABASE_URL is not set")
}

export interface Invitation {
  id: string
  memorial_id: string
  inviter_id: string
  email: string
  role: "contributor" | "moderator" | "admin"
  status: "pending" | "accepted" | "declined" | "expired"
  invitation_token: string
  message?: string
  expires_at: string
  created_at: string
  inviter_name?: string
  memorial_name?: string
}

export interface Collaborator {
  id: string
  memorial_id: string
  user_id: string
  role: "contributor" | "moderator" | "admin"
  permissions: Record<string, boolean>
  invited_by?: string
  joined_at: string
  user_name?: string
  user_email?: string
}

export async function createInvitation(data: {
  memorial_id: string
  inviter_id: string
  email: string
  role: "contributor" | "moderator" | "admin"
  message?: string
}): Promise<Invitation> {
  const invitation_token = crypto.randomUUID()

  const [invitation] = await getSql()`
    INSERT INTO invitations (memorial_id, inviter_id, email, role, invitation_token, message)
    VALUES (${data.memorial_id}, ${data.inviter_id}, ${data.email}, ${data.role}, ${invitation_token}, ${data.message})
    RETURNING *
  `

  return invitation as Invitation
}

export async function getInvitationsByMemorial(memorial_id: string): Promise<Invitation[]> {
  const invitations = await getSql()`
    SELECT 
      i.*,
      u.name as inviter_name,
      m.full_name as memorial_name
    FROM invitations i
    LEFT JOIN users u ON i.inviter_id = u.id
    LEFT JOIN memorials m ON i.memorial_id = m.id
    WHERE i.memorial_id = ${memorial_id}
    ORDER BY i.created_at DESC
  `

  return invitations as Invitation[]
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const [invitation] = await getSql()`
    SELECT 
      i.*,
      u.name as inviter_name,
      m.full_name as memorial_name
    FROM invitations i
    LEFT JOIN users u ON i.inviter_id = u.id
    LEFT JOIN memorials m ON i.memorial_id = m.id
    WHERE i.invitation_token = ${token}
    AND i.status = 'pending'
    AND i.expires_at > NOW()
  `

  return invitation as Invitation | null
}

export async function acceptInvitation(token: string, user_id: string): Promise<boolean> {
  try {
    const sql = getSql()
    // Get invitation details
    const invitation = await getInvitationByToken(token)
    if (!invitation) {
      return false
    }

    // Start transaction
    await sql`BEGIN`

    // Update invitation status
    await sql`
      UPDATE invitations 
      SET status = 'accepted', updated_at = NOW()
      WHERE invitation_token = ${token}
    `

    // Add user as collaborator
    await sql`
      INSERT INTO memorial_collaborators (memorial_id, user_id, role, invited_by)
      VALUES (${invitation.memorial_id}, ${user_id}, ${invitation.role}, ${invitation.inviter_id})
      ON CONFLICT (memorial_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        invited_by = EXCLUDED.invited_by
    `

    await sql`COMMIT`
    return true
  } catch (error) {
    try { const sql = getSql(); await sql`ROLLBACK` } catch {}
    console.error("Error accepting invitation:", error)
    return false
  }
}

export async function declineInvitation(token: string): Promise<boolean> {
  try {
    const sql = getSql()
    await sql`
      UPDATE invitations 
      SET status = 'declined', updated_at = NOW()
      WHERE invitation_token = ${token}
    `
    return true
  } catch (error) {
    console.error("Error declining invitation:", error)
    return false
  }
}

export async function getCollaboratorsByMemorial(memorial_id: string): Promise<Collaborator[]> {
  const collaborators = await getSql()`
    SELECT 
      mc.*,
      u.name as user_name,
      u.email as user_email
    FROM memorial_collaborators mc
    LEFT JOIN users u ON mc.user_id = u.id
    WHERE mc.memorial_id = ${memorial_id}
    ORDER BY mc.joined_at DESC
  `

  return collaborators as Collaborator[]
}

export async function removeCollaborator(memorial_id: string, user_id: string): Promise<boolean> {
  try {
    const sql = getSql()
    await sql`
      DELETE FROM memorial_collaborators 
      WHERE memorial_id = ${memorial_id} AND user_id = ${user_id}
    `
    return true
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return false
  }
}

export async function updateCollaboratorRole(
  memorial_id: string,
  user_id: string,
  role: "contributor" | "moderator" | "admin",
): Promise<boolean> {
  try {
    const sql = getSql()
    await sql`
      UPDATE memorial_collaborators 
      SET role = ${role}
      WHERE memorial_id = ${memorial_id} AND user_id = ${user_id}
    `
    return true
  } catch (error) {
    console.error("Error updating collaborator role:", error)
    return false
  }
}
