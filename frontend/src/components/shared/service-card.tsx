import type { Service } from "../../types";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { StatusBadge } from "./status-badge";

interface ServiceCardProps {
  service: Service;
  className?: string;
}

export function ServiceCard({ service, className }: ServiceCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{service.name}</CardTitle>
            <CardDescription>{service.description}</CardDescription>
          </div>
          <StatusBadge status={service.status} />
        </div>
      </CardHeader>
    </Card>
  );
}
