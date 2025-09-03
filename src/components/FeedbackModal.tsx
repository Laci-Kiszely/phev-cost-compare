import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";

interface FeedbackFormData {
  name: string;
  email: string;
  title: string;
  feedback: string;
}

const FeedbackModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: "",
    email: "",
    title: "",
    feedback: "",
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Name is required",
        description: "Please enter your name.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email is required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('feedback-submit', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          title: formData.title.trim() || null,
          feedback: formData.feedback.trim(),
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit feedback');
      }

      toast({
        title: "Feedback sent!",
        description: "Thank you for your feedback. We appreciate your input.",
      });

      // Reset form and close modal
      setFormData({ name: "", email: "", title: "", feedback: "" });
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", title: "", feedback: "" });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-electric)]"
        >
          <MessageCircle className="h-4 w-4" />
          Your feedback is welcome
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Send us your feedback
          </DialogTitle>
          <DialogDescription>
            We'd love to hear your thoughts, suggestions, or any issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feedback-name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-email" className="text-sm font-medium">
              Email address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feedback-email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title" className="text-sm font-medium">
              Title of feedback
            </Label>
            <Input
              id="feedback-title"
              placeholder="Brief description of your feedback"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-details" className="text-sm font-medium">
              Feedback details
            </Label>
            <Textarea
              id="feedback-details"
              placeholder="Please share your thoughts, suggestions, or issues..."
              value={formData.feedback}
              onChange={(e) => handleInputChange("feedback", e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="order-1 sm:order-2"
          >
            {isSubmitting ? "Sending..." : "Send feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;