import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import type { DocumentFilters as Filters } from "../lib/types";
import { DocumentFilters } from "./DocumentFilters";

describe("DocumentFilters", () => {
  it("updates filter fields through callbacks", () => {
    const calls: Filters[] = [];

    function Harness() {
      const [filters, setFilters] = useState<Filters>({});

      return (
        <DocumentFilters
          filters={filters}
          onChange={(next) => {
            calls.push(next);
            setFilters(next);
          }}
        />
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: "active" },
    });
    fireEvent.change(screen.getByLabelText("主题"), {
      target: { value: "knowledge" },
    });

    expect(calls[calls.length - 1]).toEqual(
      expect.objectContaining({
        status: "active",
        theme: "knowledge",
      }),
    );
  });
});
