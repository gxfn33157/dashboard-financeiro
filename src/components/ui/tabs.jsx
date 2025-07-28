import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }) => (
  <TabsPrimitive.List
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-gray-800 p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({ className, ...props }) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
      "data-[state=active]:bg-white data-[state=active]:text-black",
      "hover:bg-gray-700 hover:text-white",
      className
    )}
    {...props}
  />
);

export const TabsContent = TabsPrimitive.Content;
