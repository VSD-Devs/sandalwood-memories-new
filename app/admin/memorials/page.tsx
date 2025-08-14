import { getMemorials, updateMemorialStatus, deleteMemorial } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MoreHorizontal,
  Search,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  Settings,
  Calendar,
  Heart,
  Users,
  Clock,
  Shield,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { revalidatePath } from "next/cache"

export const dynamic = "force-dynamic"

async function approveMemorial(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await updateMemorialStatus(id, "active")
  revalidatePath("/admin/memorials")
}

async function archiveMemorial(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await updateMemorialStatus(id, "archived")
  revalidatePath("/admin/memorials")
}

async function deleteMemorialAction(formData: FormData) {
  "use server"
  const id = formData.get("id") as string
  await deleteMemorial(id)
  revalidatePath("/admin/memorials")
}

export default async function MemorialsPage() {
  const memorials = await getMemorials(50)

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="border-b border-rose-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-serif">Memorial Management</h1>
              <p className="text-gray-600 mt-2">Manage and moderate memorial pages with care</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/50">
                {memorials.length} Total Memorials
              </Badge>
              <Link href="/admin">
                <Button variant="outline" className="bg-white/50">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-rose-400" />
                <Input
                  placeholder="Search memorials by name, creator, or date..."
                  className="pl-10 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                />
              </div>
              <Button variant="outline" className="bg-rose-50 border-rose-200 hover:bg-rose-100">
                <Settings className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="bg-amber-50 border-amber-200 hover:bg-amber-100">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              All Memorials ({memorials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {memorials.map((memorial) => (
                <div
                  key={memorial.id}
                  className="flex items-center justify-between p-6 border border-rose-100 rounded-lg hover:bg-rose-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {memorial.profile_image_url && (
                      <img
                        src={memorial.profile_image_url || "/placeholder.svg"}
                        alt={memorial.full_name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-rose-200 shadow-sm"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{memorial.full_name}</h3>
                      <p className="text-gray-600 mb-1">{memorial.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Created by {memorial.creator_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(memorial.created_at).toLocaleDateString()}
                        </span>
                        {memorial.birth_date && memorial.death_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(memorial.birth_date).getFullYear()} -{" "}
                            {new Date(memorial.death_date).getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        memorial.status === "active"
                          ? "default"
                          : memorial.status === "pending"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        memorial.status === "active"
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : memorial.status === "pending"
                            ? "bg-amber-500 hover:bg-amber-600 animate-pulse"
                            : ""
                      }
                    >
                      {memorial.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        memorial.is_public
                          ? "border-blue-200 text-blue-700 bg-blue-50"
                          : "border-gray-200 text-gray-700 bg-gray-50"
                      }
                    >
                      {memorial.is_public ? "Public" : "Private"}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-rose-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/memorial/${memorial.id}`} className="flex items-center">
                            <Eye className="mr-2 h-4 w-4 text-blue-600" />
                            View Memorial
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4 text-amber-600" />
                          Edit Details
                        </DropdownMenuItem>
                        {memorial.status === "pending" && (
                          <DropdownMenuItem asChild>
                            <form action={approveMemorial}>
                              <input type="hidden" name="id" value={memorial.id} />
                              <button type="submit" className="flex items-center w-full text-emerald-600">
                                <Shield className="mr-2 h-4 w-4" />
                                Approve Memorial
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                        {memorial.status === "active" && (
                          <DropdownMenuItem asChild>
                            <form action={archiveMemorial}>
                              <input type="hidden" name="id" value={memorial.id} />
                              <button type="submit" className="flex items-center w-full text-amber-600">
                                <Clock className="mr-2 h-4 w-4" />
                                Archive Memorial
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <form action={deleteMemorialAction}>
                            <input type="hidden" name="id" value={memorial.id} />
                            <button type="submit" className="flex items-center w-full text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Memorial
                            </button>
                          </form>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
