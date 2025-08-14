import { getInvitationByToken, acceptInvitation } from "@/lib/invitations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Shield, Crown, CheckCircle, XCircle } from "lucide-react"
import { redirect } from "next/navigation"

async function acceptInvite(formData: FormData) {
  "use server"
  const token = formData.get("token") as string
  // In a real app, you'd get the user ID from the session
  const user_id = "sample-user-id"

  const success = await acceptInvitation(token, user_id)
  if (success) {
    redirect("/dashboard?invited=true")
  }
}

async function declineInvite(formData: FormData) {
  "use server"
  const token = formData.get("token") as string
  // Handle decline logic
  redirect("/?declined=true")
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const invitation = await getInvitationByToken(params.token)

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600">This invitation link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-5 w-5 text-rose-600" />
      case "moderator":
        return <Shield className="h-5 w-5 text-amber-600" />
      default:
        return <Users className="h-5 w-5 text-blue-600" />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "admin":
        return "Full access to manage the memorial, invite others, and moderate content"
      case "moderator":
        return "Can manage content, approve contributions, and help maintain the memorial"
      default:
        return "Can add photos, videos, timeline events, and share memories"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-t-lg text-center">
          <div className="flex justify-center mb-4">
            <Heart className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">You're Invited</CardTitle>
          <p className="text-rose-100">Join us in celebrating a life well-lived</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{invitation.memorial_name}</h2>
            <p className="text-gray-600">
              <strong>{invitation.inviter_name}</strong> has invited you to contribute to this memorial page.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              {getRoleIcon(invitation.role)}
              <Badge
                className={
                  invitation.role === "admin"
                    ? "bg-rose-500"
                    : invitation.role === "moderator"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                }
              >
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{getRoleDescription(invitation.role)}</p>
          </div>

          {invitation.message && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 italic">"{invitation.message}"</p>
            </div>
          )}

          <div className="flex gap-3">
            <form action={declineInvite} className="flex-1">
              <input type="hidden" name="token" value={params.token} />
              <Button type="submit" variant="outline" className="w-full bg-transparent">
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </form>
            <form action={acceptInvite} className="flex-1">
              <input type="hidden" name="token" value={params.token} />
              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </Button>
            </form>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
