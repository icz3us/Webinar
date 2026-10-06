import { z } from "zod";

export const registrationSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  fullName: z.string().min(2, "Please enter your full name.").max(120),
  affiliation: z.string().trim().min(2, "Please enter your affiliation.").max(160),
  participantCategory: z.enum(["student", "educator", "it_professional", "general_public", "other"]),
  otherCategory: z.string().trim().max(80).optional(),
  sessions: z.array(z.enum(["session-1", "session-2"])).min(1, "Please select at least one session."),
  privacyConsent: z.boolean().refine((value) => value, "Please accept the data privacy consent before continuing."),
}).superRefine((value, context) => {
  if (value.participantCategory === "other" && !value.otherCategory) {
    context.addIssue({ code: "custom", path: ["otherCategory"], message: "Please specify your category." });
  }
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const attendanceSchema = z.object({
  registrationIds: z.array(z.string().uuid()).min(1),
  sessionId: z.string().uuid(),
  status: z.enum(["present", "absent"]),
});
