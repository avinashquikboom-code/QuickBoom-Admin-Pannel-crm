import {
  Bot,
  Cloud,
  Mail,
  Map,
  MessageCircle,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';

export const INTEGRATION_ICONS = {
  'aws-s3': Cloud,
  msg91: MessagesSquare,
  'google-maps': Map,
  whatsapp: MessageCircle,
  smtp: Mail,
  gemini: Sparkles,
  openai: Bot,
  default: Cloud,
};
