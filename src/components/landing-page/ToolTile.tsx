import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export interface ToolTileProps {
  index: number;
  title: string;
  features: string[];
  linkTo: string;
  linkText: string;
}

export function ToolTile({ index, title, features, linkTo, linkText }: ToolTileProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Apply staggered animation on mount
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsVisible(true);
      },
      100 + index * 150
    );

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`w-[480px] max-w-[90vw] rounded-lg bg-white p-6 transition-all duration-600 ease-in-out ${
        isVisible ? "scale-100 opacity-100" : "scale-70 opacity-0"
      }`}
      style={{
        boxShadow:
          "0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)",
      }}
    >
      <h3 className="mb-4 text-2xl font-bold">{title}</h3>
      <ul className="list-disc space-y-2 pl-5">
        {features.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
      <Link className="mt-6 flex" to={linkTo} viewTransition>
        <Button variant="default" size="lg" className="w-52 shadow-lg">
          {linkText}
        </Button>
      </Link>
    </div>
  );
}
