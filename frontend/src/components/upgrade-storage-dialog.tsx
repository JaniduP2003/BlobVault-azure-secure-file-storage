"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StoragePlan {
  id: string;
  name: string;
  storage: string;
  price: number;
  period: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  color: string;
}

const STORAGE_PLANS: StoragePlan[] = [
  {
    id: "free",
    name: "Free",
    storage: "5 GB",
    price: 0,
    period: "forever",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "5 GB storage",
      "Basic file sharing",
      "30-day trash retention",
      "Standard support",
    ],
    color: "from-gray-500 to-gray-600",
  },
  {
    id: "basic",
    name: "Basic",
    storage: "50 GB",
    price: 4.99,
    period: "month",
    icon: <Zap className="h-6 w-6" />,
    features: [
      "50 GB storage",
      "Advanced file sharing",
      "90-day trash retention",
      "Priority support",
      "File versioning",
    ],
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "pro",
    name: "Pro",
    storage: "200 GB",
    price: 9.99,
    period: "month",
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    features: [
      "200 GB storage",
      "Advanced file sharing",
      "Unlimited trash retention",
      "24/7 Premium support",
      "File versioning",
      "Advanced encryption",
      "Collaboration tools",
    ],
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "business",
    name: "Business",
    storage: "1 TB",
    price: 19.99,
    period: "month",
    icon: <Rocket className="h-6 w-6" />,
    features: [
      "1 TB storage",
      "Unlimited file sharing",
      "Unlimited trash retention",
      "24/7 Premium support",
      "File versioning",
      "Advanced encryption",
      "Collaboration tools",
      "API access",
      "Custom branding",
      "Admin controls",
    ],
    color: "from-orange-500 to-red-600",
  },
];

interface UpgradeStorageDialogProps {
  trigger?: React.ReactNode;
  currentPlan?: string;
}

export function UpgradeStorageDialog({
  trigger,
  currentPlan = "free",
}: UpgradeStorageDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    
    // Simulate upgrade process
    setTimeout(() => {
      toast({
        title: "Upgrade Initiated",
        description: `Your upgrade to ${
          STORAGE_PLANS.find((p) => p.id === planId)?.name
        } plan is being processed.`,
      });
      setOpen(false);
      setSelectedPlan(null);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Upgrade Storage
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upgrade Your Storage
          </DialogTitle>
          <DialogDescription>
            Choose the perfect plan for your storage needs. Upgrade or downgrade
            anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
          {STORAGE_PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const isPlanSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-lg border-2 p-6 transition-all hover:shadow-lg",
                  plan.popular
                    ? "border-purple-500 shadow-md scale-105"
                    : "border-border",
                  isCurrentPlan && "ring-2 ring-green-500"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      CURRENT
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {/* Icon and Name */}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                        plan.color
                      )}
                    >
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {plan.storage}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <Button
                    className={cn(
                      "w-full mt-4",
                      plan.popular && "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                    )}
                    variant={plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan || isPlanSelected}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isPlanSelected
                      ? "Processing..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : plan.price === 0
                      ? "Downgrade"
                      : "Upgrade"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All plans include end-to-end encryption and secure file storage.</p>
          <p className="mt-1">Cancel or change your plan anytime.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
