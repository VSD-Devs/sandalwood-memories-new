import { getDashboardStats, getMemorials } from "@/lib/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Heart,
  MessageSquare,
  Eye,
  TrendingUp,
  Clock,
  Shield,
  Bell,
  Settings,
  BarChart3,
  Calendar,
  UserPlus,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const [stats, recentMemorials] = await Promise.all([
    getDashboardStats(),
    getMemorials(5),
  ])

  const totalMemorials = stats.memorials.active + stats.memorials.pending + stats.memorials.archived
  const totalTributes = (stats.tributes.approved || 0) + (stats.tributes.pending || 0) + (stats.tributes.rejected || 0)
  const pendingActions = stats.memorials.pending

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-serif">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Memorial Platform Management</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingActions > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pendingActions} pending actions
                </Badge>
              )}
              <Button variant="outline" size="sm" className="bg-white/50">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm" className="bg-white/50">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-rose-100">Total Memorials</CardTitle>
              <Heart className="h-5 w-5 text-rose-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalMemorials}</div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {stats.memorials.active} Active
                </Badge>
                {stats.memorials.pending > 0 && (
                  <Badge variant="secondary" className="bg-amber-500 text-white border-0">
                    {stats.memorials.pending} Pending
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Total Users</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{stats.users}</div>
              <div className="flex items-center text-blue-100 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                Growing community
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-100">Tributes</CardTitle>
              <MessageSquare className="h-5 w-5 text-amber-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{totalTributes}</div>
              <p className="text-amber-100 text-sm">Messages of remembrance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Platform Health</CardTitle>
              <Shield className="h-5 w-5 text-emerald-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{pendingActions === 0 ? "Excellent" : "Good"}</div>
              <div className="text-emerald-100 text-sm">
                {pendingActions === 0 ? "All caught up!" : `${pendingActions} items need attention`}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-rose-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/memorials" className="block">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-rose-50 border-rose-200 hover:bg-rose-100"
                >
                  <Heart className="h-4 w-4 mr-2 text-rose-600" />
                  Manage Memorials
                  {stats.memorials.pending > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.memorials.pending}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                Invite Administrators
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
              >
                <Settings className="h-4 w-4 mr-2 text-emerald-600" />
                Platform Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Platform activity over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <span className="text-sm font-medium">New memorial created</span>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">New user registered</span>
                  </div>
                  <span className="text-xs text-gray-500">6 hours ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Memorials */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Recent Memorials
              </CardTitle>
              <CardDescription className="text-rose-100">Latest memorial pages created</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentMemorials.map((memorial) => (
                  <div
                    key={memorial.id}
                    className="flex items-center justify-between p-4 border border-rose-100 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {memorial.profile_image_url && (
                        <img
                          src={memorial.profile_image_url || "/placeholder.svg"}
                          alt={memorial.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
                        />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{memorial.full_name}</h4>
                        <p className="text-sm text-gray-600">{memorial.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(memorial.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            ? "bg-emerald-500"
                            : memorial.status === "pending"
                              ? "bg-amber-500"
                              : ""
                        }
                      >
                        {memorial.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="hover:bg-rose-100">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/admin/memorials">
                  <Button className="w-full bg-rose-600 hover:bg-rose-700">View All Memorials</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

        </div>

        {pendingActions > 0 && (
          <Card className="mt-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">Action Required</h3>
                  <p className="text-sm text-amber-700">
                    You have {pendingActions} items that need your attention.
                    {stats.memorials.pending > 0 && ` ${stats.memorials.pending} memorials awaiting approval.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
