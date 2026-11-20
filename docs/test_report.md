# Test report

- Test date:
- Tested by:
- Application version / commit:

| Test ID | Test case | Expected result | Actual result | Pass/Fail | Notes |
|---|---|---|---|---|---|
| T01 | API health endpoint | Status OK | | | |
| T02 | Valid form values | Accepted by API when model exists | | | |
| T03 | Empty form field | Frontend validation message | | | |
| T04 | Sleep outside 0–24 | Rejected | | | |
| T05 | Soreness outside 1–10 | Rejected | | | |
| T06 | Negative rest days | Rejected | | | |
| T07 | Zero/negative weight | Rejected | | | |
| T08 | API unavailable | Clear error shown | | | |
| T09 | Model missing | Controlled 503 response | | | |
| T10 | Mobile layout | Controls remain usable | | | |

## Defects found

List each issue, owner, priority, and fix.

## Sign-off

- Frontend:
- Backend:
- Dataset/ML:
- Testing:
