
"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";

type WelcomeScreenProps = {
  onEnter: () => void;
};

export function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-neutral-950 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Visual accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-green-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto text-center relative z-10">
         <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative w-full max-w-[98vw] sm:max-w-[900px] lg:max-w-[1100px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <Image 
                  src="/logo-agro.png" 
                  alt="ClimatAgro Logo" 
                  width={1100} 
                  height={350} 
                  className="w-full h-auto drop-shadow-[0_0_20px_rgba(37,99,235,0.25)] rounded-[2rem]"
                  priority
                  referrerPolicy="no-referrer"
                />
            </div>
        </div>
        
        <p className="mt-2 text-lg text-white max-w-2xl mx-auto font-normal tracking-wide italic font-sans text-center">
          {t('welcome.subtitle')}
        </p>
        
        <div className="mt-12">
            <Button 
                size="default" 
                onClick={onEnter} 
                className="px-6 py-4 text-lg rounded-full shadow-2xl bg-blue-600 hover:bg-blue-500 text-white border-none transition-all hover:scale-105 active:scale-95 group"
            >
              {t('welcome.enterButton')} 
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
        </div>
      </div>
    </div>
  );
}
