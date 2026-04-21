import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Rocket, User, ExternalLink, Mail, FileText, FileType2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <DialogHeader className="text-center">
          <DialogTitle className="text-glow flex items-center justify-center gap-2 mx-auto">
            <Rocket className="h-5 w-5 text-primary" />
            Projectile Motion Simulator
          </DialogTitle>
          <DialogDescription className="text-xs mx-auto">
            Version 3.2.0 · Educational physics tool
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
            <Rocket className="h-3.5 w-3.5" /> About the App
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-center px-2 sm:px-4">
            This interactive simulation is designed to support the learning of projectile motion as
            presented in the{" "}
            <a
              href={TMSIM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="story-link inline-flex items-center gap-0.5 text-primary font-medium"
            >
              Technology-Mediated Strategic Intervention Material
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            . It allows students to visualize and explore how objects move through the air by
            adjusting variables such as velocity, angle, and height. By combining real-time
            animation with accurate physics calculations, the app helps learners better understand
            concepts like range, time of flight, and maximum height — making abstract ideas more
            concrete, engaging, and easier to grasp.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
            <User className="h-3.5 w-3.5" /> About the Proponent
          </h3>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground text-center px-2 sm:px-4">
            This application is based on the Technology-Mediated Strategic Intervention Material in
            General Physics 1 developed by{" "}
            <a
              href={`mailto:${PROPONENT_EMAIL}`}
              className="story-link inline-flex items-center gap-0.5 text-primary font-medium"
            >
              Rene D. Mistiola
              <Mail className="h-3 w-3 shrink-0" />
            </a>{" "}
            under the Department of Education – Schools Division of Batangas. The proponent aims to
            enhance physics education through interactive technology by transforming traditional
            problem-solving into a visual and engaging learning experience. This initiative supports
            guided and independent learning, helping students connect theoretical concepts with
            real-world motion.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center justify-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Documentation
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground text-center px-2 sm:px-4">
            Download the official documentation covering the user guide, physics explanation,
            technical details, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <a
                href="/docs/Projectile_Motion_Simulator_Documentation.pdf"
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <a
                href="/docs/Projectile_Motion_Simulator_Documentation.docx"
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <FileType2 className="h-4 w-4" />
                Download DOCX
              </a>
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
};
