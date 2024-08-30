import { Typography } from "antd";

type siderContent = {
  model: string;
  stance: string;
  personality: string;
};

type LlmSiderProps = {
  position: "left" | "right";
  content: siderContent;
};

export default function LlmSider({ position, content }: LlmSiderProps) {
  return (
    <div>
      <Typography.Title level={3}>
        {position === "left" ? "Debater 1" : "Debater 2"}
      </Typography.Title>
      <Typography.Title level={4}>{content.model}</Typography.Title>
      <Typography.Title level={4}>
        {content.stance.length > 0 ? "Stance: " + content.stance : ""}
      </Typography.Title>
      <Typography.Title level={4}>
        {content.personality.length > 0
          ? "Personality: " + content.personality
          : ""}
      </Typography.Title>
    </div>
  );
}
