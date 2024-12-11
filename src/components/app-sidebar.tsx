"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Calendar,
  HelpCircle,
  Home,
  Inbox,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DiscordIcon from "./icons/discord";
import { ModeToggle } from "./page-components/theme-toggle";

const ICON_STROKE_WIDTH = 1.5;
const ICON_SIZE = 16;

// Menu items.
const appItems = [
  {
    title: "Home",
    url: "/",
    icon: () => <Home strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
  {
    title: "Test",
    url: "/test-page",
    icon: () => <Inbox strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
  {
    title: "Calendar",
    url: "#",
    icon: () => <Calendar strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
  {
    title: "Search",
    url: "#",
    icon: () => <Search strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
  {
    title: "Settings",
    url: "#",
    icon: () => <Settings strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
];

const helpItems = [
  {
    title: "Help",
    url: "https://heavenly-tent-fff.notion.site/Ophiuchi-Developers-Toolkit-734dc4f766fe40aebfe0da3cbbc304f5?pvs=4",
    isBlank: true,
    icon: () => <HelpCircle strokeWidth={ICON_STROKE_WIDTH} size={ICON_SIZE} />,
  },
  {
    title: "Discord",
    url: "https://discord.gg/fpp8kNyPtz",
    isBlank: true,
    icon: () => <DiscordIcon className="w-4 h-4" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <img src="/app-icon.svg" className="w-8" alt="" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupLabel>Application</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {appItems.map((item) => {
              const isActive = item.url === pathname;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroupLabel>Help</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {helpItems.map((item) => {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      target={item.isBlank ? "_blank" : "_self"}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
