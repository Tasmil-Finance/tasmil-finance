import { motion } from "framer-motion";
import { Typography } from "./ui/typography";

export const Greeting = () => {
  return (
    <div
      className="mt-4 flex size-full flex-col justify-center px-4 md:mt-16 "
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <Typography className="font-semibold text-[30px]">
          Your Intelligent DeFi
        </Typography>
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className=""
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        <Typography className="text-2xl text-muted-foreground md:text-3xl">
          How can I help you today?
        </Typography>
      </motion.div>
    </div>
  );
};
