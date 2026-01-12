import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Star, Phone } from "lucide-react";

export default function Feedback() {
  const { toast } = useToast();
  const [rating, setRating] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      const result = await response.json();
      if (result.success) {
        setFeedbacks(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      toast({ variant: "destructive", title: "Rating required", description: "Please select a reaction to rate us." });
      return;
    }
    if (!mobileNumber) {
      toast({ variant: "destructive", title: "Mobile number required", description: "Please enter your mobile number." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber,
          rating,
          message: "User Feedback" // Schema requires message
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Thank you!", description: "Your feedback has been submitted." });
        setRating(null);
        setMobileNumber("");
        fetchFeedback();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit feedback" });
    } finally {
      setLoading(false);
    }
  };

  const emotions = [
    { value: 4, emoji: "🙂", label: "Good" },
    { value: 5, emoji: "🤩", label: "Excellent" }, // Using 5 for excellent to match standard 5-star logic internally, or just mapping
    { value: 3, emoji: "😐", label: "Neutral" },
    { value: 1, emoji: "🤬", label: "Angry" }
  ];

  // Re-ordering to match image: Happy, Excited, Neutral, Angry
  // Note: The image order is a bit ambiguous on 'value', but let's assume left-to-right is positive to negative or mixed. 
  // Let's stick to the visual order in the image: Smiley -> ThumbsUp/Starstruck -> Neutral -> Angry.

  const reactions = [
    { id: 1, value: 4, emoji: "🙂", color: "hover:scale-125" },
    { id: 2, value: 5, emoji: "🤩", color: "hover:scale-125" },
    { id: 3, value: 3, emoji: "😐", color: "hover:scale-125" },
    { id: 4, value: 1, emoji: "🤬", color: "hover:scale-125" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col items-center">

      {/* Feedback Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <Card className="overflow-hidden border-none shadow-2xl relative bg-[#E8D475]">
          {/* Background geometric shape simulation */}
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#FFF9C4] to-[#E8D475] z-0" style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 60%)" }}></div>

          <CardContent className="p-8 relative z-10 flex flex-col items-center text-center h-[500px] justify-center">

            <motion.h1
              className="text-3xl md:text-4xl font-bold text-[#D32F2F] mb-8"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              Give us your feedback
            </motion.h1>

            {/* Emojis */}
            <div className="flex gap-4 mb-8 justify-center">
              {reactions.map((r) => (
                <motion.button
                  key={r.id}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(r.value)}
                  className={`text-5xl transition-all duration-300 ${rating === r.value ? 'scale-125 drop-shadow-lg' : 'opacity-80 hover:opacity-100'}`}
                >
                  {r.emoji}
                </motion.button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <div className="relative">
                <Input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="bg-white border-none h-12 text-lg px-4 shadow-sm text-center"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-semibold bg-[#B8860B] hover:bg-[#996515] text-white shadow-md transition-all"
              >
                {loading ? "Sending..." : (
                  <span className="flex items-center gap-2">
                    Send feedback <Send className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Feedback Section */}
      <div className="w-full max-w-4xl mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Star className="text-yellow-500 fill-yellow-500" /> Recent Feedback
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {feedbacks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow bg-white">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-gray-700">
                        {item.mobileNumber || "Anonymous"}
                      </span>
                      <span className="text-2xl" title={`Rating: ${item.rating}`}>
                        {reactions.find(r => r.value === item.rating)?.emoji || "💬"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {feedbacks.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No feedback yet. Be the first!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
