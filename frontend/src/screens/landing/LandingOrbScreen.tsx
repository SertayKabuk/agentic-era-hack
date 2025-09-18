import React from "react";
import DottedOrb from "../../shared/ui/DottedOrb";
import { ConsoleScreenDotted, DemoScreenDotted } from "../../shared/ui/DottedChip";
import "./landing-orb.scss";

type LandingOrbScreenProps = {
  onEnter: () => void;
  onEnterDemo?: () => void;
};

export default function LandingOrbScreen({ onEnter, onEnterDemo }: LandingOrbScreenProps) {
  return (
    <div className="landing-orb-screen">
      <div
        className="center"
        style={{ ['--orb-size' as any]: '300px', ['--chip-gap' as any]: '56px' }}
      >
        <DottedOrb
          size={300}
          accentColor="#5a7fff"
          label="Customer Care Agents"
          description="Speak with a support agent for quick assistance and problem resolution."
        />
        <ConsoleScreenDotted
          className="chip-dotted right"
          size={130}
          motionScale={16}
          colors={["#F7FAFC", "#DDE4EA", "#6AAFE6"]}
          onClick={onEnter}
        />
        <DemoScreenDotted
          className="chip-dotted left"
          size={130}
          motionScale={16}
          colors={["#B3E5FC", "#4FC3F7", "#1565C0"]}
          onClick={onEnterDemo}
        />
      </div>
    </div>
  );
}
