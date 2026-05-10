
"use client";

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/language-context";

const BrazilFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 9 6">
    <rect width="9" height="6" fill="#009B3A"/>
    <path d="M4.5 0.5L1 3L4.5 5.5L8 3Z" fill="#FEDF00"/>
    <circle cx="4.5" cy="3" r="1.2" fill="#002776"/>
  </svg>
);

const USFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 76 40">
      <rect width="76" height="40" fill="#B22234"/>
      <path
        d="M0,4 h40 M0,12 h40 M0,20 h40 M0,28 h40 M0,36 h40 M40,8 h36 M40,16 h36 M40,24 h36 M40,32 h36"
        stroke="#fff"
        strokeWidth="4"
      />
      <rect width="40" height="28" fill="#3C3B6E"/>
   </svg>
);


const SpainFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 6 4">
    <rect width="6" height="4" fill="#C60B1E"/>
    <rect width="6" height="2" y="1" fill="#FFC400"/>
  </svg>
);


export function LanguageSwitcher() {
  const { setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("pt")}>
            <BrazilFlag />
            <span className="ml-2">Português</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("en")}>
            <USFlag />
            <span className="ml-2">English</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("es")}>
            <SpainFlag />
            <span className="ml-2">Español</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
