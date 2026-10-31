import os

report_script_path = "docs/generate_round3_report.py"

with open(report_script_path, "r", encoding="utf-8") as f:
    code = f.read()

old_toc = '''    toc_data = [
        [Paragraph("Section 1  -  Premium Cover Page", table_cell), Paragraph("Page 1", table_cell_bold)],
        [Paragraph("Section 2  -  Executive Summary &amp; Table of Contents", table_cell), Paragraph("Page 2", table_cell_bold)],
        [Paragraph("Section 3  -  Problem Statement and Product Vision", table_cell), Paragraph("Page 3", table_cell_bold)],
        [Paragraph("Section 4  -  Complete Product Features (Round 2 + Round 3)", table_cell), Paragraph("Page 4", table_cell_bold)],
        [Paragraph("Section 5  -  Round 3 Improvements and Implementation (The 3 Major Innovations)", table_cell), Paragraph("Page 6", table_cell_bold)],
        [Paragraph("Section 6  -  Technical Architecture and Implementation Summary", table_cell), Paragraph("Page 8", table_cell_bold)],
        [Paragraph("Section 7  -  Complete Data Flow and Operational Workflow (12 Steps)", table_cell), Paragraph("Page 10", table_cell_bold)],
        [Paragraph("Section 8  -  API and System Integration (Exhaustive Route Catalog)", table_cell), Paragraph("Page 11", table_cell_bold)],
        [Paragraph("Section 9  -  Complete Testing and Verification Details (41/41 Passed Pytest Suite)", table_cell), Paragraph("Page 13", table_cell_bold)],
        [Paragraph("Section 10  -  Live Product Demonstration &amp; Verified Screen Captures", table_cell), Paragraph("Page 14", table_cell_bold)],
        [Paragraph("Section 11  -  Round 2 vs. Round 3 Product Evolution Matrix", table_cell), Paragraph("Page 16", table_cell_bold)],
        [Paragraph("Section 12  -  Security, Reliability, and Enterprise Readiness", table_cell), Paragraph("Page 17", table_cell_bold)],
        [Paragraph("Section 13  -  Team Contributions &amp; Collaborative Methodology", table_cell), Paragraph("Page 18", table_cell_bold)],
        [Paragraph("Section 14  -  Product Roadmap and Future Development Plan", table_cell), Paragraph("Page 19", table_cell_bold)],
        [Paragraph("Section 15  -  Conclusion &amp; Official Submission Certification", table_cell), Paragraph("Page 20", table_cell_bold)],
    ]'''

new_toc = '''    toc_data = [
        [Paragraph("Section 1  -  Premium Cover Page", table_cell), Paragraph("Page 1", table_cell_bold)],
        [Paragraph("Section 2  -  Executive Summary &amp; Table of Contents", table_cell), Paragraph("Page 2", table_cell_bold)],
        [Paragraph("Section 3  -  Problem Statement and Product Vision", table_cell), Paragraph("Page 3", table_cell_bold)],
        [Paragraph("Section 4  -  Complete Product Features (Round 2 + Round 3)", table_cell), Paragraph("Page 4", table_cell_bold)],
        [Paragraph("Section 5  -  Round 3 Improvements and Implementation (The 3 Major Innovations)", table_cell), Paragraph("Page 5", table_cell_bold)],
        [Paragraph("Section 6  -  Technical Architecture and Implementation Summary", table_cell), Paragraph("Page 6", table_cell_bold)],
        [Paragraph("Section 7  -  Complete Data Flow and Operational Workflow (12 Steps)", table_cell), Paragraph("Page 8", table_cell_bold)],
        [Paragraph("Section 8  -  API and System Integration (Exhaustive Route Catalog)", table_cell), Paragraph("Page 9", table_cell_bold)],
        [Paragraph("Section 9  -  Complete Testing and Verification Details (41/41 Passed Pytest Suite)", table_cell), Paragraph("Page 10", table_cell_bold)],
        [Paragraph("Section 10  -  Live Product Demonstration &amp; Verified Screen Captures", table_cell), Paragraph("Page 11", table_cell_bold)],
        [Paragraph("Section 11  -  Round 2 vs. Round 3 Product Evolution Matrix", table_cell), Paragraph("Page 13", table_cell_bold)],
        [Paragraph("Section 12  -  Security, Reliability, and Enterprise Readiness", table_cell), Paragraph("Page 14", table_cell_bold)],
        [Paragraph("Section 13  -  Team Contributions &amp; Collaborative Methodology", table_cell), Paragraph("Page 14", table_cell_bold)],
        [Paragraph("Section 14  -  Product Roadmap and Future Development Plan", table_cell), Paragraph("Page 15", table_cell_bold)],
        [Paragraph("Section 15  -  Conclusion &amp; Official Submission Certification", table_cell), Paragraph("Page 15", table_cell_bold)],
    ]'''

if old_toc in code:
    code = code.replace(old_toc, new_toc)
    with open(report_script_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Table of Contents page numbers updated successfully!")
else:
    print("old_toc not found directly, checking...")
