"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LabeledSlider } from "./labeled-slider";
import { preTradeSchema, type PreTradeFormValues } from "@/lib/validation";
import { OBJECTIVE_PRESETS } from "@/lib/constants";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

const DEFAULT_VALUES: PreTradeFormValues = {
  sleep: 5,
  stress: 5,
  confidence: 5,
  energy: 5,
  objective: "",
};

export function PreTradeForm({ onComplete }: { onComplete: (values: PreTradeFormValues) => void }) {
  const { watch, setValue, register, handleSubmit } = useForm<PreTradeFormValues>({
    resolver: zodResolver(preTradeSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });
  const [customObjective, setCustomObjective] = useState(false);
  const values = watch();
  const valid = values.objective.trim().length > 0;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.form
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit(onComplete)}
      className="mx-auto max-w-md"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <h1 className="font-serif text-2xl font-medium">Ready for today?</h1>
        <p className="mt-1 text-sm text-ledger-muted">{today} · takes under a minute</p>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-6">
        <LabeledSlider
          label="Sleep"
          value={values.sleep}
          onChange={(v) => setValue("sleep", v, { shouldValidate: true })}
          lowHint="Rough night"
          highHint="Fully rested"
        />
        <LabeledSlider
          label="Stress"
          value={values.stress}
          onChange={(v) => setValue("stress", v, { shouldValidate: true })}
          lowHint="Calm"
          highHint="Wound up"
        />
        <LabeledSlider
          label="Confidence"
          value={values.confidence}
          onChange={(v) => setValue("confidence", v, { shouldValidate: true })}
          lowHint="Unsure"
          highHint="Locked in"
        />
        <LabeledSlider
          label="Energy"
          value={values.energy}
          onChange={(v) => setValue("energy", v, { shouldValidate: true })}
          lowHint="Drained"
          highHint="Sharp"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-8">
        <Label>Today's objective</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {OBJECTIVE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setCustomObjective(false);
                setValue("objective", preset, { shouldValidate: true });
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                !customObjective && values.objective === preset
                  ? "border-brass bg-brass/[.13] text-brass"
                  : "border-hairline bg-panel-raised text-ledger-muted hover:border-ledger-muted"
              )}
            >
              {preset}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomObjective(true);
              setValue("objective", "", { shouldValidate: true });
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              customObjective
                ? "border-brass bg-brass/[.13] text-brass"
                : "border-hairline bg-panel-raised text-ledger-muted hover:border-ledger-muted"
            )}
          >
            Custom...
          </button>
        </div>
        {customObjective && (
          <Input
            autoFocus
            placeholder="Write your own objective"
            className="mt-3"
            {...register("objective")}
          />
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="mt-9">
        <Button type="submit" disabled={!valid} className="w-full py-6 text-base">
          Start session
        </Button>
      </motion.div>
    </motion.form>
  );
}
