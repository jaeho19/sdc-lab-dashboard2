"use client";

import type {
  ReportWithDetails,
  SubProject,
  ReportContentMatrix,
  ReportContentLogEntry,
  ReportContentList,
} from "@/types/database";

interface PrintLayoutProps {
  report: ReportWithDetails;
  subProjects: SubProject[];
  format: "basic" | "official";
  includeSections: Record<string, boolean>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatPeriod(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getMonth() + 1}.${s.getDate()} ~ ${e.getMonth() + 1}.${e.getDate()}`;
}

export function PrintLayout({
  report,
  subProjects,
  format,
  includeSections,
}: PrintLayoutProps) {
  const template = report.template;
  const sortedSubProjects = [...subProjects].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div className="print-layout print-only">
      {/* Official format header */}
      {format === "official" && includeSections.info && (
        <div className="print-header print-section">
          {template?.header_config?.org_name && (
            <span className="text-lg font-bold">
              {template.header_config.org_name}
            </span>
          )}
        </div>
      )}

      {/* Report info section */}
      {includeSections.info && (
        <div className="print-section" style={{ marginBottom: "16px" }}>
          <h1
            style={{
              fontSize: format === "official" ? "18pt" : "16pt",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            {report.title}
          </h1>
          <p
            style={{
              textAlign: "center",
              fontSize: "11pt",
              color: "#666",
            }}
          >
            보고기간: {formatPeriod(report.period_start, report.period_end)}
          </p>
          {format === "official" && report.project && (
            <p
              style={{
                textAlign: "center",
                fontSize: "11pt",
                color: "#666",
                marginTop: "4px",
              }}
            >
              프로젝트: {report.project.short_name ?? report.project.name}
            </p>
          )}
        </div>
      )}

      {/* Progress table sections */}
      {includeSections.progressTable &&
        template?.sections
          .filter((s) => s.type === "progress_matrix")
          .map((section) => {
            const matrixContent = report.content[section.id] as
              | ReportContentMatrix
              | undefined;

            return (
              <div
                key={section.id}
                className="print-section"
                style={{ marginBottom: "16px" }}
              >
                <h2
                  style={{
                    fontSize: "13pt",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    borderBottom: "2px solid #333",
                    paddingBottom: "4px",
                  }}
                >
                  {section.title}
                </h2>

                <table
                  className="print-table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10pt",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid #333",
                          padding: "6px 8px",
                          backgroundColor: "#f5f5f5",
                          fontWeight: "bold",
                          textAlign: "left",
                          width: "20%",
                        }}
                      >
                        업무구분
                      </th>
                      {section.columns?.map((col) => (
                        <th
                          key={col.key}
                          style={{
                            border: "1px solid #333",
                            padding: "6px 8px",
                            backgroundColor: "#f5f5f5",
                            fontWeight: "bold",
                            textAlign: "left",
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubProjects.map((sp) => {
                      const cellData = matrixContent?.[sp.id];
                      return (
                        <tr key={sp.id}>
                          <td
                            style={{
                              border: "1px solid #333",
                              padding: "6px 8px",
                              fontWeight: "500",
                              verticalAlign: "top",
                            }}
                          >
                            {sp.name}
                          </td>
                          {section.columns?.map((col) => {
                            const entries: ReportContentLogEntry[] =
                              (cellData?.[col.key] as ReportContentLogEntry[]) ?? [];
                            return (
                              <td
                                key={col.key}
                                style={{
                                  border: "1px solid #333",
                                  padding: "6px 8px",
                                  verticalAlign: "top",
                                }}
                              >
                                {entries.length > 0 ? (
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: "16px",
                                    }}
                                  >
                                    {entries.map((entry) => (
                                      <li
                                        key={entry.log_id}
                                        style={{ marginBottom: "2px" }}
                                      >
                                        {entry.text}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span style={{ color: "#999" }}>-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

      {/* List & text sections (meetings, remarks, etc.) */}
      {template?.sections
        .filter((s) => s.type === "list" || s.type === "text")
        .map((section) => {
          // Determine if this section should be included
          const sectionKey =
            section.title.includes("회의") || section.title.includes("보고")
              ? "meetings"
              : "remarks";
          if (!includeSections[sectionKey]) return null;

          const sectionContent = report.content[section.id];

          return (
            <div
              key={section.id}
              className="print-section"
              style={{ marginBottom: "16px" }}
            >
              <h2
                style={{
                  fontSize: "13pt",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  borderBottom: "1px solid #666",
                  paddingBottom: "4px",
                }}
              >
                {section.title}
              </h2>

              {section.type === "list" &&
                sectionContent &&
                "items" in sectionContent && (
                  <ul
                    style={{
                      paddingLeft: "20px",
                      fontSize: "10pt",
                    }}
                  >
                    {(sectionContent as ReportContentList).items.map((item) => (
                      <li
                        key={item.log_id}
                        style={{ marginBottom: "4px" }}
                      >
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}

              {section.type === "text" &&
                sectionContent &&
                "text" in sectionContent && (
                  <p
                    style={{
                      fontSize: "10pt",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {(sectionContent as { text: string }).text || "(내용 없음)"}
                  </p>
                )}
            </div>
          );
        })}

      {/* Official format footer */}
      {format === "official" && (
        <div className="print-footer">
          <p>작성일: {formatDate(report.updated_at)}</p>
          {report.template?.header_config?.org_name && (
            <p>{report.template.header_config.org_name}</p>
          )}
        </div>
      )}
    </div>
  );
}
