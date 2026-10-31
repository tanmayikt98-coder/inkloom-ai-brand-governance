import os

report_script_path = "docs/generate_round3_report.py"

with open(report_script_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace h3_style with h2_style
code = code.replace("Table 10.1: Live Governance Studio Module Screen Verifications\", h3_style))", "Table 10.1: Live Governance Studio Module Screen Verifications\", h2_style))")

with open(report_script_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed h3_style to h2_style")
