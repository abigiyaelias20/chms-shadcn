"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconUserShield,
  IconUser,
  IconBuilding,
  IconCalendarEvent,
  IconNews,
  IconCoin,
  IconBook,
  IconBellRinging,
  IconGoGame,
  IconSteam,
  IconUsersGroup,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Define user roles
export type UserRole = 'Admin' | 'Staff' | 'Member'

// Define user type
export interface User {
  name: string
  email: string
  avatar: string
  role: UserRole
}

// Define navigation item types
export interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<any>
  items?: NavItem[]
  isActive?: boolean
}

// Navigation items for different roles
const adminNavMain: NavItem[] = [
  { title: "Ministries", url: "/dashboard/admin/ministry", icon: IconDashboard },
  { title: "User Management", url: "/dashboard/admin/users", icon: IconUserShield },
  { title: "Members", url: "/dashboard/admin/member", icon: IconChartBar },
  { title: "Staffs", url: "/dashboard/admin/staff", icon: IconSettings },
  { title: "Teams", url: "/dashboard/admin/team", icon: IconUsersGroup },
  { title: "Events", url: "/dashboard/admin/events", icon: IconGoGame },

]

const staffNavMain: NavItem[] = [
  { title: "Teams", url: "/dashboard/staff/team", icon: IconUsersGroup },
  { title: "Events", url: "/dashboard/staff/event", icon: IconCalendarEvent },
]

const memberNavMain: NavItem[] = [
  { title: "Dashboard", url: "/dashboard/member", icon: IconDashboard },
  { title: "My Profile", url: "/dashboard/member/profile", icon: IconUser },
  { title: "Events", url: "/dashboard/member/events", icon: IconCalendarEvent },
  { title: "Giving", url: "/dashboard/member/giving", icon: IconCoin },
  { title: "Resources", url: "/dashboard/member/resources", icon: IconBook },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error("Failed to parse user from localStorage:", err)
      }
    }
  }, [])

  const getNavMain = (role: UserRole): NavItem[] => {
    switch (role) {
      case "Admin": return adminNavMain
      case "Staff": return staffNavMain
      case "Member": return memberNavMain
      default: return memberNavMain
    }
  }

  if (!user) {
    // optional: render nothing or a loading placeholder until user is fetched
    return null
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  Grace Community Church
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavMain(user.role)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
