import React from "react";
import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
        <p className="text-primary-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
