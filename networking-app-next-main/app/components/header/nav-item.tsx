import Link from "next/link";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { Button } from "../ui/button";
import { LucideIcon } from "lucide-react";

export type NavItemType = {
  title: string;
  Icon: LucideIcon;
  href: string;
  dot?: boolean;
};
export default function NavItem({ title, Icon, href, dot }: NavItemType) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {href && (
          <Link href={href} className="relative">
            <Button variant={"ghost"} className="w-16 h-16 opacity-60 hover:opacity-100" size={"icon"}>
              <Icon size={32} strokeWidth={2} />
            </Button>
            {dot && (
              <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
            )}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}
