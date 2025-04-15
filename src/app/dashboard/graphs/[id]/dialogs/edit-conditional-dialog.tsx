import { useState, useEffect } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { Tables } from "@/types/supabase";
import { useAuth } from "@/lib/hooks/use-auth";

import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditPromptDialog } from "@/app/dashboard/prompts/edit-prompt-dialog";

