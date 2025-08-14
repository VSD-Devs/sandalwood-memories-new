import { getTributes, approveTribute, deleteTribute } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Search, MessageSquare } from "lucide-react"
import Link from "next/link"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

async function approveTributeAction(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await approveTribute(id)
  revalidatePath("/admin/tributes")
}

async function deleteTributeAction(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await deleteTribute(id)
  revalidatePath("/admin/tributes")
}

export default async function TributesPage() {
  const tributes = await getTributes(50)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tribute Management</h1>
            <p className="text-gray-600 mt-2">Review and moderate tribute messages</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search tributes..." className="pl-10" />
            </div>
          </CardContent>
        </Card>

        {/* Tributes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              All Tributes ({tributes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {tributes.map((tribute) => (
                <div key={tribute.id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{tribute.author_name}</h3>
                      <p className="text-sm text-gray-600">
                        For {tribute.full_name} • {new Date(tribute.created_at).toLocaleDateString()}
                      </p>
                      {tribute.author_email && <p className="text-xs text-gray-500">{tribute.author_email}</p>}
                    </div>
                    <Badge variant={tribute.is_approved ? "default" : "destructive"}>
                      {tribute.is_approved ? "Approved" : "Pending Review"}
                    </Badge>
                  </div>

                  <div className="bg-white p-4 rounded border-l-4 border-l-rose-200 mb-4">
                    <p className="text-gray-800 leading-relaxed">{tribute.message}</p>
                  </div>

                  <div className="flex gap-2">
                    {!tribute.is_approved && (
                      <form action={approveTributeAction} className="inline">
                        <input type="hidden" name="id" value={tribute.id} />
                        <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </form>
                    )}
                    <form action={deleteTributeAction} className="inline">
                      <input type="hidden" name="id" value={tribute.id} />
                      <Button type="submit" size="sm" variant="destructive">
                        <X className="mr-2 h-4 w-4" />
                        {tribute.is_approved ? "Delete" : "Reject"}
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
