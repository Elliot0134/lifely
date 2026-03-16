"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

import { SidebarMenuButton } from "@/components/ui/sidebar"

interface AnimatedNavItemProps {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
}

export function AnimatedNavItem({
  title,
  url,
  icon: Icon,
  isActive,
}: AnimatedNavItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <SidebarMenuButton asChild tooltip={title} data-active={isActive}>
      <Link
        href={url}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          animate={
            isHovered
              ? { scale: 1.2, rotate: 8 }
              : { scale: 1, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="flex items-center justify-center"
        >
          <Icon className="size-4" />
        </motion.div>
        <span>{title}</span>
      </Link>
    </SidebarMenuButton>
  )
}
