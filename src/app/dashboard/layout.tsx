"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { AppSidebar } from "./sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const pathSegments = pathname.split("/").filter(Boolean);
  const isGraphDetailPage =
    pathname.includes("/graphs/") && pathSegments.length === 3;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {isGraphDetailPage ? (
        <div className="h-screen w-screen bg-background">{children}</div>
      ) : (
        <SidebarProvider>
          <div className="flex h-screen w-screen bg-background">
            <AppSidebar />
            <div className="flex-1 w-full">
              <div className="flex items-center gap-4 px-5 pt-5">
                <SidebarTrigger />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        Dashboard
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathSegments.slice(1).map((segment, index) => (
                      <React.Fragment key={segment}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {index === pathSegments.slice(1).length - 1 ? (
                            <BreadcrumbPage className="capitalize">
                              {segment}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              href={`/${pathSegments
                                .slice(0, index + 2)
                                .join("/")}`}
                              className="capitalize"
                            >
                              {segment}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="container mx-auto overflow-auto px-6 py-4 space-y-5">
                {children}
              </div>
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      )}
    </ThemeProvider>
  );
}
