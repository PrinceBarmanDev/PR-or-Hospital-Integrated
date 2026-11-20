# Dataset inspection report

- File: `openpowerlifting.csv`
- Rows: 4,067,854
- Columns: 42
- Duplicate rows: 4,245

## Column names and data types

| Column | Data type | Missing values |
|---|---|---:|
| `Name` | `str` | 0 |
| `Sex` | `str` | 0 |
| `Event` | `str` | 0 |
| `Equipment` | `str` | 0 |
| `Age` | `float64` | 1,466,752 |
| `AgeClass` | `str` | 1,092,933 |
| `BirthYearClass` | `str` | 1,380,041 |
| `Division` | `str` | 3,821 |
| `BodyweightKg` | `float64` | 44,464 |
| `WeightClassKg` | `str` | 60,519 |
| `Squat1Kg` | `float64` | 2,726,697 |
| `Squat2Kg` | `float64` | 2,740,613 |
| `Squat3Kg` | `float64` | 2,772,438 |
| `Squat4Kg` | `float64` | 4,057,760 |
| `Best3SquatKg` | `float64` | 1,233,716 |
| `Bench1Kg` | `float64` | 2,124,888 |
| `Bench2Kg` | `float64` | 2,147,366 |
| `Bench3Kg` | `float64` | 2,202,771 |
| `Bench4Kg` | `float64` | 4,042,944 |
| `Best3BenchKg` | `float64` | 457,433 |
| `Deadlift1Kg` | `float64` | 2,567,190 |
| `Deadlift2Kg` | `float64` | 2,592,451 |
| `Deadlift3Kg` | `float64` | 2,644,484 |
| `Deadlift4Kg` | `float64` | 4,039,336 |
| `Best3DeadliftKg` | `float64` | 1,023,234 |
| `TotalKg` | `float64` | 271,538 |
| `Place` | `str` | 0 |
| `Dots` | `float64` | 297,777 |
| `Wilks` | `float64` | 297,777 |
| `Glossbrenner` | `float64` | 297,777 |
| `Goodlift` | `float64` | 610,261 |
| `Tested` | `str` | 967,403 |
| `Country` | `str` | 100,379 |
| `State` | `str` | 3,194,183 |
| `Federation` | `str` | 0 |
| `ParentFederation` | `str` | 1,599,019 |
| `Date` | `str` | 0 |
| `MeetCountry` | `str` | 0 |
| `MeetState` | `str` | 1,192,833 |
| `MeetTown` | `str` | 571,278 |
| `MeetName` | `str` | 0 |
| `Sanctioned` | `str` | 0 |

## First five rows

```text
          Name Sex Event Equipment  Age AgeClass BirthYearClass Division  BodyweightKg WeightClassKg  Squat1Kg  Squat2Kg  Squat3Kg  Squat4Kg  Best3SquatKg  Bench1Kg  Bench2Kg  Bench3Kg  Bench4Kg  Best3BenchKg  Deadlift1Kg  Deadlift2Kg  Deadlift3Kg  Deadlift4Kg  Best3DeadliftKg  TotalKg Place   Dots  Wilks  Glossbrenner  Goodlift Tested Country State Federation ParentFederation       Date MeetCountry MeetState  MeetTown                     MeetName Sanctioned
Bill Gillespie   M    BD Unlimited 59.0    55-59            NaN     Open         146.6          140+       NaN       NaN       NaN       NaN           NaN       NaN       NaN       NaN       NaN         386.0          NaN          NaN          NaN          NaN            249.5    635.5     1 343.87 352.76        334.11       NaN    Yes     USA   NaN AmericanSA              NaN 2018-10-12         USA        VA Lynchburg      DT Liberty Fall Classic        Yes
   Andre Mealy   M     B       Raw 24.0    24-34          24-39     Open         123.8           125       NaN       NaN       NaN       NaN           NaN       NaN       NaN       NaN       NaN         222.0          NaN          NaN          NaN          NaN              NaN    222.0     1 126.21 126.76        121.39     92.43    Yes     USA   NaN AmericanSA              NaN 2018-10-12         USA        VA Lynchburg      DT Liberty Fall Classic        Yes
David Lambauch   M   SBD       Raw  NaN      NaN            NaN     Open          88.1            90       NaN       NaN       NaN       NaN         152.5       NaN       NaN       NaN       NaN         117.5          NaN          NaN          NaN          NaN            185.0    455.0     1 297.43 293.71        281.76     61.13    Yes     USA   NaN AmericanSA              NaN 2018-12-05         USA        VA Lynchburg DT Liberty Christmas Classic        Yes
 Jeff Boschman   M     D       Raw 26.0    24-34          24-39     Open         108.9           110       NaN       NaN       NaN       NaN           NaN       NaN       NaN       NaN       NaN           NaN          NaN          NaN          NaN          NaN            310.0    310.0     1 184.30 183.00        174.86       NaN    Yes     USA   NaN AmericanSA              NaN 2018-12-05         USA        VA Lynchburg DT Liberty Christmas Classic        Yes
Ben Williamson   M     D       Raw  NaN      NaN            NaN     Open         121.3           125       NaN       NaN       NaN       NaN           NaN       NaN       NaN       NaN       NaN           NaN          NaN          NaN          NaN          NaN            285.0    285.0     1 163.10 163.45        156.63       NaN    Yes     USA   NaN AmericanSA              NaN 2018-12-05         USA        VA Lynchburg DT Liberty Christmas Classic        Yes
```

## Compatibility check

The current API/ML training template requires these exact numeric feature columns:

- `sleep_hours`
- `soreness`
- `rest_days`
- `target_weight_kg`

A valid categorical target column must also be selected and documented.
Matching column names alone do not prove that the data has the correct meaning or units.
Do not fabricate missing fields or labels. If the dataset does not contain compatible
features and a defensible target, consult the faculty mentor before changing the dataset
or project target.

## Source and licence

Record the exact source URL, access date, licence/terms, and any required attribution here.
Verify the terms for the exact downloaded file before redistribution.