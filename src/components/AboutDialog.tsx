import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Rocket, User, ExternalLink, Mail } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TMSIM_URL = "https://drive.google.com/drive/folders/1lbzVuuO_Ufo4KlFUFrLO2urOEnCbMn_Q";
const PROPONENT_EMAIL = "rene.mistiola@deped.gov.ph";

export const AboutDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto panel-gradient">
        <DialogHeader>
          <DialogTitle className="text-glow flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            About Projectile Motion Simulator
          </DialogTitle>
          <DialogDescription className="text-xs">
            Version 3.2.0 · Educational physics tool
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Rocket className="h-3.5 w-3.5" /> About the App
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This interactive simulation is designed to support the learning of projectile motion as
            presented in the{" "}
            <a
              href={TMSIM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="story-link inline-flex items-center gap-0.5 text-primary font-medium"
            >
              Technology-Mediated Strategic Intervention Material
              <ExternalLink className="h-3 w-3" />
            </a>
            . It allows students to visualize and explore how objects move through the air by
            adjusting variables such as velocity, angle, and height. By combining real-time
            animation with accurate physics calculations, the app helps learners better understand
            concepts like range, time of flight, and maximum height — making abstract ideas more
            concrete, engaging, and easier to grasp.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> About the Proponent
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This application is based on the Technology-Mediated Strategic Intervention Material in
            General Physics 1 developed by{" "}
            <a
              href={`mailto:${PROPONENT_EMAIL}`}
              className="story-link inline-flex items-center gap-0.5 text-primary font-medium"
            >
              Rene D. Mistiola
              <Mail className="h-3 w-3" />
            </a>{" "}
            under the Department of Education – Schools Division of Batangas. The proponent aims to
            enhance physics education through interactive technology by transforming traditional
            problem-solving into a visual and engaging learning experience. This initiative supports
            guided and independent learning, helping students connect theoretical concepts with
            real-world motion.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
};
