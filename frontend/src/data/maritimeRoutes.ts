export interface MaritimeRoute {
  from: string;
  fromCode: string;
  departureTimeText: string;
  to: string;
  toCode: string;
  etaText: string;
  etaSentence: string;
  progressPercent: number;
  speedKnots: number;
  draftMeters: number;
  distanceRemainingNm: number;
  timeRemainingText: string;
  waypoints: [number, number][];
  currentPos: [number, number];
  heading: number;
}

// Gerçekçi deniz trafiği koridorları (36 Adet Uluslararası Rota ve Koordinatlar)
export const MARITIME_ROUTES: Record<number, MaritimeRoute> = {
  "1": {
    "from": "İzmir Alsancak",
    "fromCode": "TRIZM",
    "departureTimeText": "8 saat önce (06:00)",
    "to": "İstanbul (Ambarlı)",
    "toCode": "TRIST",
    "etaText": "Bugün 20:30",
    "etaSentence": "Bugün saat 20:30'da limana yanaşacak",
    "progressPercent": 68,
    "speedKnots": 13.8,
    "draftMeters": 9.8,
    "distanceRemainingNm": 48,
    "timeRemainingText": "3 sa 30 dk",
    "waypoints": [
      [
        38.46,
        27.05
      ],
      [
        38.52,
        26.75
      ],
      [
        38.68,
        26.4
      ],
      [
        39.2,
        25.8
      ],
      [
        39.85,
        25.85
      ],
      [
        40.03,
        26.15
      ],
      [
        40.15,
        26.4
      ],
      [
        40.35,
        26.65
      ],
      [
        40.7,
        27.6
      ],
      [
        40.85,
        28.3
      ],
      [
        40.97,
        28.69
      ]
    ],
    "currentPos": [
      40.511,
      27.0871
    ],
    "heading": 64
  },
  "2": {
    "from": "İstanbul (Ambarlı)",
    "fromCode": "TRIST",
    "departureTimeText": "Dün 14:00 (24 saat önce)",
    "to": "Mersin (MIP)",
    "toCode": "TRMER",
    "etaText": "Yarın 08:00",
    "etaSentence": "Yarın saat 08:00'de limana yanaşacak",
    "progressPercent": 48,
    "speedKnots": 16.2,
    "draftMeters": 12.4,
    "distanceRemainingNm": 310,
    "timeRemainingText": "18 saat",
    "waypoints": [
      [
        40.97,
        28.69
      ],
      [
        40.8,
        28.1
      ],
      [
        40.35,
        26.65
      ],
      [
        40.15,
        26.4
      ],
      [
        40.02,
        26.15
      ],
      [
        39.2,
        25.75
      ],
      [
        38.25,
        25.85
      ],
      [
        37.2,
        26.2
      ],
      [
        36.15,
        27.5
      ],
      [
        35.8,
        29.2
      ],
      [
        35.7,
        30.8
      ],
      [
        35.6,
        32.5
      ],
      [
        36.2,
        34
      ],
      [
        36.75,
        34.6
      ]
    ],
    "currentPos": [
      36.3079,
      27.3046
    ],
    "heading": 135
  },
  "3": {
    "from": "İstanbul (Ambarlı)",
    "fromCode": "TRIST",
    "departureTimeText": "2 saat önce (12:00)",
    "to": "Kocaeli (DP World)",
    "toCode": "TRKOC",
    "etaText": "Bugün 17:00",
    "etaSentence": "Bugün saat 17:00'de limana yanaşacak",
    "progressPercent": 65,
    "speedKnots": 10.5,
    "draftMeters": 7.2,
    "distanceRemainingNm": 15,
    "timeRemainingText": "1 sa 30 dk",
    "waypoints": [
      [
        40.97,
        28.69
      ],
      [
        40.93,
        28.84
      ],
      [
        40.94,
        29.02
      ],
      [
        40.85,
        29.15
      ],
      [
        40.78,
        29.3
      ],
      [
        40.76,
        29.45
      ],
      [
        40.75,
        29.52
      ],
      [
        40.76,
        29.65
      ],
      [
        40.77,
        29.74
      ]
    ],
    "currentPos": [
      40.7724,
      29.3567
    ],
    "heading": 100
  },
  "4": {
    "from": "Piraeus (Atina)",
    "fromCode": "GRPIR",
    "departureTimeText": "18 saat önce (20:00)",
    "to": "Tekirdağ (Asyaport)",
    "toCode": "TRASY",
    "etaText": "Yarın 04:30",
    "etaSentence": "Yarın saat 04:30'da limana yanaşacak",
    "progressPercent": 52,
    "speedKnots": 14.8,
    "draftMeters": 11,
    "distanceRemainingNm": 160,
    "timeRemainingText": "11 saat",
    "waypoints": [
      [
        37.94,
        23.64
      ],
      [
        37.75,
        23.75
      ],
      [
        37.6,
        24.05
      ],
      [
        37.9,
        24.7
      ],
      [
        38.5,
        25.1
      ],
      [
        39.4,
        25.5
      ],
      [
        40.02,
        26.15
      ],
      [
        40.15,
        26.4
      ],
      [
        40.35,
        26.65
      ],
      [
        40.65,
        27.2
      ],
      [
        40.85,
        27.42
      ],
      [
        40.92,
        27.46
      ]
    ],
    "currentPos": [
      39.2844,
      25.4486
    ],
    "heading": 19
  },
  "5": {
    "from": "İzmir Alsancak",
    "fromCode": "TRIZM",
    "departureTimeText": "28 saat önce (10:00)",
    "to": "Mersin (MIP)",
    "toCode": "TRMER",
    "etaText": "Bu gece 23:00",
    "etaSentence": "Bu gece saat 23:00'te limana yanaşacak",
    "progressPercent": 62,
    "speedKnots": 15,
    "draftMeters": 8.5,
    "distanceRemainingNm": 135,
    "timeRemainingText": "9 saat",
    "waypoints": [
      [
        38.45,
        27.1
      ],
      [
        38.52,
        26.75
      ],
      [
        38.35,
        26.25
      ],
      [
        37.65,
        26.35
      ],
      [
        36.7,
        26.9
      ],
      [
        35.75,
        28.15
      ],
      [
        35.6,
        30.5
      ],
      [
        35.5,
        32.8
      ],
      [
        36.3,
        34.2
      ],
      [
        36.79,
        34.64
      ]
    ],
    "currentPos": [
      35.586,
      30.8215
    ],
    "heading": 92
  },
  "6": {
    "from": "İstanbul (Ambarlı)",
    "fromCode": "TRIST",
    "departureTimeText": "7 saat önce (07:00)",
    "to": "Köstence (Romanya)",
    "toCode": "ROKOS",
    "etaText": "Bu gece 02:00",
    "etaSentence": "Bu gece saat 02:00'de limana yanaşacak",
    "progressPercent": 58,
    "speedKnots": 14.2,
    "draftMeters": 13.5,
    "distanceRemainingNm": 115,
    "timeRemainingText": "8 saat",
    "waypoints": [
      [
        40.97,
        28.69
      ],
      [
        40.95,
        28.9
      ],
      [
        41.018,
        28.995
      ],
      [
        41.045,
        29.034
      ],
      [
        41.09,
        29.058
      ],
      [
        41.205,
        29.112
      ],
      [
        41.45,
        29.2
      ],
      [
        42.3,
        29.4
      ],
      [
        43.2,
        29
      ],
      [
        44.15,
        28.65
      ]
    ],
    "currentPos": [
      42.7112,
      29.2172
    ],
    "heading": 342
  },
  "7": {
    "from": "Piraeus (Yunanistan)",
    "fromCode": "GRPIR",
    "departureTimeText": "16 saat önce (22:00)",
    "to": "İskenderiye (Mısır)",
    "toCode": "EGALY",
    "etaText": "Yarın 12:00",
    "etaSentence": "Yarın saat 12:00'de limana yanaşacak",
    "progressPercent": 44,
    "speedKnots": 17.5,
    "draftMeters": 14.2,
    "distanceRemainingNm": 280,
    "timeRemainingText": "16 saat",
    "waypoints": [
      [
        37.94,
        23.64
      ],
      [
        37.5,
        23.9
      ],
      [
        36.7,
        24.2
      ],
      [
        35.3,
        23.5
      ],
      [
        34.7,
        24.5
      ],
      [
        34.5,
        26
      ],
      [
        34.4,
        28.5
      ],
      [
        34.5,
        31
      ],
      [
        32.5,
        30.5
      ],
      [
        31.2,
        29.9
      ]
    ],
    "currentPos": [
      34.4761,
      26.5966
    ],
    "heading": 92
  },
  "8": {
    "from": "Karaköy Rıhtımı",
    "fromCode": "TRIST",
    "departureTimeText": "15 dk önce (14:15)",
    "to": "Haydarpaşa Limanı",
    "toCode": "TRIST",
    "etaText": "Bugün 15:00",
    "etaSentence": "Bugün saat 15:00'te limana yanaşacak",
    "progressPercent": 55,
    "speedKnots": 8.4,
    "draftMeters": 4.1,
    "distanceRemainingNm": 1.8,
    "timeRemainingText": "15 dk",
    "waypoints": [
      [
        41.022,
        28.975
      ],
      [
        41.018,
        28.99
      ],
      [
        41.012,
        29.005
      ],
      [
        41.005,
        29.012
      ],
      [
        40.998,
        29.018
      ]
    ],
    "currentPos": [
      41.0134,
      29.0015
    ],
    "heading": 118
  },
  "9": {
    "from": "Piraeus (Atina)",
    "fromCode": "GRPIR",
    "departureTimeText": "14 saat önce (00:30)",
    "to": "Limassol (Kıbrıs)",
    "toCode": "CYLMS",
    "etaText": "Yarın 14:30",
    "etaSentence": "Yarın saat 14:30'da limana yanaşacak",
    "progressPercent": 48,
    "speedKnots": 16,
    "draftMeters": 6.8,
    "distanceRemainingNm": 240,
    "timeRemainingText": "15 saat",
    "waypoints": [
      [
        37.94,
        23.64
      ],
      [
        37.4,
        24.2
      ],
      [
        36.8,
        25.4
      ],
      [
        36.4,
        27.5
      ],
      [
        35.5,
        29.5
      ],
      [
        34.8,
        31.5
      ],
      [
        34.65,
        33.02
      ]
    ],
    "currentPos": [
      36.1582,
      28.0373
    ],
    "heading": 118
  },
  "10": {
    "from": "Tekirdağ (Asyaport)",
    "fromCode": "TRASY",
    "departureTimeText": "3 saat önce (11:30)",
    "to": "İstanbul (Ambarlı)",
    "toCode": "TRIST",
    "etaText": "Bugün 16:30",
    "etaSentence": "Bugün saat 16:30'da limana yanaşacak",
    "progressPercent": 70,
    "speedKnots": 12,
    "draftMeters": 9.5,
    "distanceRemainingNm": 22,
    "timeRemainingText": "2 saat",
    "waypoints": [
      [
        40.92,
        27.46
      ],
      [
        40.9,
        27.95
      ],
      [
        40.92,
        28.3
      ],
      [
        40.94,
        28.55
      ],
      [
        40.97,
        28.69
      ]
    ],
    "currentPos": [
      40.9219,
      28.3234
    ],
    "heading": 84
  },
  "11": {
    "from": "Mersin (MIP)",
    "fromCode": "TRMER",
    "departureTimeText": "6 saat önce (08:30)",
    "to": "Beyrut (Lübnan)",
    "toCode": "LBBEY",
    "etaText": "Bugün 21:00",
    "etaSentence": "Bugün saat 21:00'de limana yanaşacak",
    "progressPercent": 54,
    "speedKnots": 14,
    "draftMeters": 8.2,
    "distanceRemainingNm": 85,
    "timeRemainingText": "6 saat",
    "waypoints": [
      [
        36.79,
        34.64
      ],
      [
        36.5,
        34.8
      ],
      [
        35.8,
        35.2
      ],
      [
        34.8,
        35.5
      ],
      [
        33.91,
        35.52
      ]
    ],
    "currentPos": [
      35.3007,
      35.3498
    ],
    "heading": 166
  },
  "12": {
    "from": "İstanbul Boğazı (TSS)",
    "fromCode": "TRIST",
    "departureTimeText": "19 saat önce (19:00)",
    "to": "Trabzon Limanı",
    "toCode": "TRTZX",
    "etaText": "Yarın 10:00",
    "etaSentence": "Yarın saat 10:00'da limana yanaşacak",
    "progressPercent": 42,
    "speedKnots": 15.5,
    "draftMeters": 8.2,
    "distanceRemainingNm": 260,
    "timeRemainingText": "17 saat",
    "waypoints": [
      [40.97, 28.69],
      [40.94, 28.78],
      [40.94, 28.89],
      [40.985, 29.01],
      [41.025, 29.025],
      [41.075, 29.055],
      [41.115, 29.075],
      [41.175, 29.095],
      [41.245, 29.135],
      [41.35, 29.6],
      [41.45, 31.4],
      [41.8, 33.5],
      [42.15, 35.0],
      [41.5, 37.5],
      [41.01, 39.73]
    ],
    "currentPos": [
      41.7665,
      33.2988
    ],
    "heading": 77
  },
  "13": {
    "from": "Köstence (Romanya)",
    "fromCode": "ROKOS",
    "departureTimeText": "16 saat önce (22:00)",
    "to": "Batum (Gürcistan)",
    "toCode": "GEBAT",
    "etaText": "Yarın 18:00",
    "etaSentence": "Yarın saat 18:00'de limana yanaşacak",
    "progressPercent": 50,
    "speedKnots": 15,
    "draftMeters": 11.5,
    "distanceRemainingNm": 290,
    "timeRemainingText": "19 saat",
    "waypoints": [
      [
        44.15,
        28.66
      ],
      [
        43.8,
        30.5
      ],
      [
        43.2,
        33.5
      ],
      [
        42.6,
        36.5
      ],
      [
        42.2,
        39
      ],
      [
        41.65,
        41.64
      ]
    ],
    "currentPos": [
      42.871,
      35.1452
    ],
    "heading": 104
  },
  "14": {
    "from": "Varna (Bulgaristan)",
    "fromCode": "BGVAR",
    "departureTimeText": "7 saat önce (07:30)",
    "to": "İstanbul (Ambarlı)",
    "toCode": "TRIST",
    "etaText": "Bugün 22:30",
    "etaSentence": "Bugün saat 22:30'da limana yanaşacak",
    "progressPercent": 62,
    "speedKnots": 14,
    "draftMeters": 8.9,
    "distanceRemainingNm": 75,
    "timeRemainingText": "5 sa 30 dk",
    "waypoints": [
      [43.19, 27.92],
      [42.8, 28.2],
      [42.2, 28.6],
      [41.45, 29.15],
      [41.245, 29.135],
      [41.175, 29.095],
      [41.115, 29.075],
      [41.075, 29.055],
      [41.025, 29.025],
      [40.985, 29.01],
      [40.94, 28.89],
      [40.94, 28.78],
      [40.97, 28.69]
    ],
    "currentPos": [
      41.7114,
      28.9583
    ],
    "heading": 151
  },
  "15": {
    "from": "Batum (Gürcistan)",
    "fromCode": "GEBAT",
    "departureTimeText": "3 saat önce (11:30)",
    "to": "Trabzon Limanı",
    "toCode": "TRTZX",
    "etaText": "Bugün 18:00",
    "etaSentence": "Bugün saat 18:00'de limana yanaşacak",
    "progressPercent": 55,
    "speedKnots": 12.5,
    "draftMeters": 7.8,
    "distanceRemainingNm": 45,
    "timeRemainingText": "3 sa 30 dk",
    "waypoints": [
      [
        41.65,
        41.64
      ],
      [
        41.5,
        41.2
      ],
      [
        41.3,
        40.5
      ],
      [
        41.05,
        39.9
      ],
      [
        41.01,
        39.73
      ]
    ],
    "currentPos": [
      41.3229,
      40.58
    ],
    "heading": 249
  },
  "16": {
    "from": "Mersin (MIP)",
    "fromCode": "TRMER",
    "departureTimeText": "8 saat önce (06:30)",
    "to": "Limassol (Kıbrıs)",
    "toCode": "CYLMS",
    "etaText": "Bugün 19:00",
    "etaSentence": "Bugün saat 19:00'da limana yanaşacak",
    "progressPercent": 65,
    "speedKnots": 15.2,
    "draftMeters": 10.4,
    "distanceRemainingNm": 60,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [
        36.79,
        34.64
      ],
      [
        36.3,
        34.2
      ],
      [
        35.7,
        33.8
      ],
      [
        35,
        33.4
      ],
      [
        34.65,
        33.02
      ]
    ],
    "currentPos": [
      35.3727,
      33.613
    ],
    "heading": 205
  },
  "17": {
    "from": "Limassol (Kıbrıs)",
    "fromCode": "CYLMS",
    "departureTimeText": "5 saat önce (09:30)",
    "to": "Beyrut (Lübnan)",
    "toCode": "LBBEY",
    "etaText": "Bugün 18:30",
    "etaSentence": "Bugün saat 18:30'da limana yanaşacak",
    "progressPercent": 58,
    "speedKnots": 13.8,
    "draftMeters": 8,
    "distanceRemainingNm": 55,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [
        34.65,
        33.02
      ],
      [
        34.5,
        33.8
      ],
      [
        34.2,
        34.8
      ],
      [
        33.91,
        35.52
      ]
    ],
    "currentPos": [
      34.2925,
      34.4917
    ],
    "heading": 110
  },
  "18": {
    "from": "İskenderiye (Mısır)",
    "fromCode": "EGALY",
    "departureTimeText": "32 saat önce (06:00)",
    "to": "Valetta (Malta)",
    "toCode": "MTMLA",
    "etaText": "Yarın 16:00",
    "etaSentence": "Yarın saat 16:00'da limana yanaşacak",
    "progressPercent": 56,
    "speedKnots": 17,
    "draftMeters": 13.2,
    "distanceRemainingNm": 390,
    "timeRemainingText": "23 saat",
    "waypoints": [
      [
        31.18,
        29.87
      ],
      [
        32.5,
        28.5
      ],
      [
        33.8,
        25.5
      ],
      [
        34.8,
        21
      ],
      [
        35.5,
        16.5
      ],
      [
        35.89,
        14.51
      ]
    ],
    "currentPos": [
      34.6659,
      21.6034
    ],
    "heading": 286
  },
  "19": {
    "from": "Cenova (İtalya)",
    "fromCode": "ITGOA",
    "departureTimeText": "36 saat önce (02:00)",
    "to": "Piraeus (Yunanistan)",
    "toCode": "GRPIR",
    "etaText": "Yarın 20:00",
    "etaSentence": "Yarın saat 20:00'de limana yanaşacak",
    "progressPercent": 46,
    "speedKnots": 17.8,
    "draftMeters": 12,
    "distanceRemainingNm": 440,
    "timeRemainingText": "25 saat",
    "waypoints": [
      [44.4, 8.92],
      [43.2, 9.6],
      [41.8, 11.2],
      [39.5, 14.8],
      [38.2, 15.65],
      [37.5, 17.5],
      [36.8, 21.5],
      [36.35, 21.85],
      [36.35, 22.5],
      [36.4, 23.15],
      [37.0, 23.45],
      [37.6, 23.55],
      [37.94, 23.64]
    ],
    "currentPos": [
      39.1546,
      15.0258
    ],
    "heading": 153
  },
  "20": {
    "from": "Cenova (İtalya)",
    "fromCode": "ITGOA",
    "departureTimeText": "48 saat önce",
    "to": "Mersin (MIP)",
    "toCode": "TRMER",
    "etaText": "2 gün sonra 12:00",
    "etaSentence": "2 gün sonra saat 12:00'de limana yanaşacak",
    "progressPercent": 40,
    "speedKnots": 18.2,
    "draftMeters": 14.5,
    "distanceRemainingNm": 620,
    "timeRemainingText": "34 saat",
    "waypoints": [
      [
        44.4,
        8.92
      ],
      [
        42.8,
        9.8
      ],
      [
        40.5,
        12.5
      ],
      [
        38.2,
        15.65
      ],
      [
        36.8,
        18.5
      ],
      [
        35.5,
        24
      ],
      [
        34.8,
        28.5
      ],
      [
        35.5,
        32.5
      ],
      [
        36.79,
        34.64
      ]
    ],
    "currentPos": [
      37.1364,
      17.8152
    ],
    "heading": 121
  },
  "21": {
    "from": "Tekirdağ (Asyaport)",
    "fromCode": "TRASY",
    "departureTimeText": "11 saat önce (03:30)",
    "to": "Köstence (Romanya)",
    "toCode": "ROKOS",
    "etaText": "Bugün 23:00",
    "etaSentence": "Bugün saat 23:00'te limana yanaşacak",
    "progressPercent": 54,
    "speedKnots": 14.5,
    "draftMeters": 11.2,
    "distanceRemainingNm": 120,
    "timeRemainingText": "8 saat",
    "waypoints": [
      [40.92, 27.46],
      [40.85, 28.2],
      [40.94, 28.89],
      [40.985, 29.01],
      [41.025, 29.025],
      [41.075, 29.055],
      [41.115, 29.075],
      [41.175, 29.095],
      [41.245, 29.135],
      [42.1, 29.3],
      [43.2, 29.0],
      [44.15, 28.66]
    ],
    "currentPos": [
      42.0221,
      29.2835
    ],
    "heading": 9
  },
  "22": {
    "from": "Trabzon Limanı",
    "fromCode": "TRTZX",
    "departureTimeText": "20 saat önce (18:00)",
    "to": "Varna (Bulgaristan)",
    "toCode": "BGVAR",
    "etaText": "Yarın 06:00",
    "etaSentence": "Yarın saat 06:00'da limana yanaşacak",
    "progressPercent": 48,
    "speedKnots": 15.2,
    "draftMeters": 9,
    "distanceRemainingNm": 280,
    "timeRemainingText": "18 saat",
    "waypoints": [
      [
        41.01,
        39.73
      ],
      [
        41.5,
        37
      ],
      [
        42.1,
        34.5
      ],
      [
        42.5,
        31.5
      ],
      [
        42.8,
        29
      ],
      [
        43.19,
        27.92
      ]
    ],
    "currentPos": [
      42.1573,
      34.0705
    ],
    "heading": 281
  },
  "23": {
    "from": "Valetta (Malta)",
    "fromCode": "MTMLA",
    "departureTimeText": "26 saat önce (12:00)",
    "to": "Limassol (Kıbrıs)",
    "toCode": "CYLMS",
    "etaText": "Yarın 22:00",
    "etaSentence": "Yarın saat 22:00'de limana yanaşacak",
    "progressPercent": 62,
    "speedKnots": 16.5,
    "draftMeters": 10.8,
    "distanceRemainingNm": 340,
    "timeRemainingText": "20 saat",
    "waypoints": [
      [
        35.89,
        14.51
      ],
      [
        35.5,
        18
      ],
      [
        34.8,
        23
      ],
      [
        34.2,
        28
      ],
      [
        34.5,
        31.5
      ],
      [
        34.65,
        33.02
      ]
    ],
    "currentPos": [
      34.4433,
      25.9729
    ],
    "heading": 97
  },
  "24": {
    "from": "Beyrut (Lübnan)",
    "fromCode": "LBBEY",
    "departureTimeText": "9 saat önce (05:30)",
    "to": "Mersin (MIP)",
    "toCode": "TRMER",
    "etaText": "Bugün 21:30",
    "etaSentence": "Bugün saat 21:30'da limana yanaşacak",
    "progressPercent": 66,
    "speedKnots": 13.5,
    "draftMeters": 8.5,
    "distanceRemainingNm": 60,
    "timeRemainingText": "4 sa 30 dk",
    "waypoints": [
      [
        33.91,
        35.52
      ],
      [
        34.8,
        35.4
      ],
      [
        35.8,
        35.1
      ],
      [
        36.5,
        34.8
      ],
      [
        36.79,
        34.64
      ]
    ],
    "currentPos": [
      35.856,
      35.076
    ],
    "heading": 341
  },
  "25": {
    "from": "Kocaeli (DP World)",
    "fromCode": "TRKOC",
    "departureTimeText": "15 saat önce (23:30)",
    "to": "Piraeus (Yunanistan)",
    "toCode": "GRPIR",
    "etaText": "Yarın 08:00",
    "etaSentence": "Yarın saat 08:00'de limana yanaşacak",
    "progressPercent": 52,
    "speedKnots": 15,
    "draftMeters": 10.2,
    "distanceRemainingNm": 190,
    "timeRemainingText": "12 saat",
    "waypoints": [
      [
        40.77,
        29.74
      ],
      [
        40.75,
        29.4
      ],
      [
        40.85,
        28.3
      ],
      [
        40.4,
        26.7
      ],
      [
        40.15,
        26.4
      ],
      [
        39.5,
        25.5
      ],
      [
        38.5,
        24.8
      ],
      [
        37.94,
        23.64
      ]
    ],
    "currentPos": [
      40.0312,
      26.2355
    ],
    "heading": 227
  },
  "26": {
    "from": "İskenderiye (Mısır)",
    "fromCode": "EGALY",
    "departureTimeText": "18 saat önce (20:30)",
    "to": "Mersin (MIP)",
    "toCode": "TRMER",
    "etaText": "Bugün 23:30",
    "etaSentence": "Bugün saat 23:30'da limana yanaşacak",
    "progressPercent": 64,
    "speedKnots": 16,
    "draftMeters": 12.8,
    "distanceRemainingNm": 120,
    "timeRemainingText": "7 sa 30 dk",
    "waypoints": [
      [
        31.18,
        29.87
      ],
      [
        32.8,
        31.5
      ],
      [
        34.2,
        33.2
      ],
      [
        35.5,
        34.2
      ],
      [
        36.79,
        34.64
      ]
    ],
    "currentPos": [
      34.4392,
      33.384
    ],
    "heading": 32
  },
  "27": {
    "from": "Batum (Gürcistan)",
    "fromCode": "GEBAT",
    "departureTimeText": "22 saat önce (16:30)",
    "to": "Köstence (Romanya)",
    "toCode": "ROKOS",
    "etaText": "Yarın 14:00",
    "etaSentence": "Yarın saat 14:00'te limana yanaşacak",
    "progressPercent": 46,
    "speedKnots": 14.5,
    "draftMeters": 10,
    "distanceRemainingNm": 310,
    "timeRemainingText": "21 saat",
    "waypoints": [
      [
        41.65,
        41.64
      ],
      [
        42.2,
        39
      ],
      [
        42.8,
        35.5
      ],
      [
        43.5,
        32
      ],
      [
        44.15,
        28.66
      ]
    ],
    "currentPos": [
      42.7718,
      35.6643
    ],
    "heading": 284
  },
  "28": {
    "from": "Limassol (Kıbrıs)",
    "fromCode": "CYLMS",
    "departureTimeText": "12 saat önce (02:30)",
    "to": "İskenderiye (Mısır)",
    "toCode": "EGALY",
    "etaText": "Bugün 22:00",
    "etaSentence": "Bugün saat 22:00'de limana yanaşacak",
    "progressPercent": 58,
    "speedKnots": 15,
    "draftMeters": 9.4,
    "distanceRemainingNm": 105,
    "timeRemainingText": "7 saat",
    "waypoints": [
      [
        34.65,
        33.02
      ],
      [
        33.8,
        32.2
      ],
      [
        32.5,
        31
      ],
      [
        31.18,
        29.87
      ]
    ],
    "currentPos": [
      32.6699,
      31.1569
    ],
    "heading": 218
  },
  "29": {
    "from": "İzmir Alsancak",
    "fromCode": "TRIZM",
    "departureTimeText": "6 saat önce (08:30)",
    "to": "Tekirdağ (Asyaport)",
    "toCode": "TRASY",
    "etaText": "Bugün 20:00",
    "etaSentence": "Bugün saat 20:00'de limana yanaşacak",
    "progressPercent": 72,
    "speedKnots": 14,
    "draftMeters": 8.8,
    "distanceRemainingNm": 50,
    "timeRemainingText": "3 sa 30 dk",
    "waypoints": [
      [
        38.45,
        27.1
      ],
      [
        38.65,
        26.4
      ],
      [
        39.4,
        25.8
      ],
      [
        40.02,
        26.15
      ],
      [
        40.35,
        26.65
      ],
      [
        40.8,
        27.3
      ],
      [
        40.92,
        27.46
      ]
    ],
    "currentPos": [
      40.2802,
      26.5443
    ],
    "heading": 49
  },
  "30": {
    "from": "İstanbul (Ambarlı)",
    "fromCode": "TRIST",
    "departureTimeText": "24 saat önce",
    "to": "Batum (Gürcistan)",
    "toCode": "GEBAT",
    "etaText": "Yarın 20:00",
    "etaSentence": "Yarın saat 20:00'de limana yanaşacak",
    "progressPercent": 52,
    "speedKnots": 15.6,
    "draftMeters": 11,
    "distanceRemainingNm": 270,
    "timeRemainingText": "17 saat",
    "waypoints": [
      [
        40.97,
        28.69
      ],
      [
        41.05,
        29.02
      ],
      [
        41.25,
        29.12
      ],
      [
        41.6,
        31.5
      ],
      [
        42.2,
        35.5
      ],
      [
        42,
        39
      ],
      [
        41.65,
        41.64
      ]
    ],
    "currentPos": [
      42.1765,
      35.3431
    ],
    "heading": 77
  },
  "31": {
    "from": "Piraeus (Yunanistan)",
    "fromCode": "GRPIR",
    "departureTimeText": "18 saat önce (20:30)",
    "to": "Valetta (Malta)",
    "toCode": "MTMLA",
    "etaText": "Bugün 23:00",
    "etaSentence": "Bugün saat 23:00'te limana yanaşacak",
    "progressPercent": 60,
    "speedKnots": 16.5,
    "draftMeters": 10.5,
    "distanceRemainingNm": 180,
    "timeRemainingText": "11 saat",
    "waypoints": [
      [37.94, 23.64],
      [37.6, 23.55],
      [37.0, 23.45],
      [36.4, 23.15],
      [36.35, 22.5],
      [36.35, 21.85],
      [36.0, 18.0],
      [35.89, 14.51]
    ],
    "currentPos": [
      36.0506,
      18.354
    ],
    "heading": 261
  },
  "32": {
    "from": "Mersin (MIP)",
    "fromCode": "TRMER",
    "departureTimeText": "14 saat önce (00:30)",
    "to": "İskenderiye (Mısır)",
    "toCode": "EGALY",
    "etaText": "Bugün 20:00",
    "etaSentence": "Bugün saat 20:00'de limana yanaşacak",
    "progressPercent": 56,
    "speedKnots": 15.8,
    "draftMeters": 12,
    "distanceRemainingNm": 150,
    "timeRemainingText": "9 sa 30 dk",
    "waypoints": [
      [
        36.79,
        34.64
      ],
      [
        35.5,
        34.2
      ],
      [
        34.2,
        33.2
      ],
      [
        32.8,
        31.5
      ],
      [
        31.18,
        29.87
      ]
    ],
    "currentPos": [
      33.4379,
      32.2746
    ],
    "heading": 226
  },
  "33": {
    "from": "Tekirdağ (Asyaport)",
    "fromCode": "TRASY",
    "departureTimeText": "8 saat önce (06:30)",
    "to": "Varna (Bulgaristan)",
    "toCode": "BGVAR",
    "etaText": "Bugün 21:00",
    "etaSentence": "Bugün saat 21:00'de limana yanaşacak",
    "progressPercent": 65,
    "speedKnots": 13.5,
    "draftMeters": 8.6,
    "distanceRemainingNm": 85,
    "timeRemainingText": "6 saat",
    "waypoints": [
      [
        40.92,
        27.46
      ],
      [
        40.85,
        28.2
      ],
      [
        41.1,
        29.06
      ],
      [
        41.25,
        29.12
      ],
      [
        42.2,
        28.8
      ],
      [
        43.19,
        27.92
      ]
    ],
    "currentPos": [
      42.0862,
      28.8383
    ],
    "heading": 346
  },
  "34": {
    "from": "Köstence (Romanya)",
    "fromCode": "ROKOS",
    "departureTimeText": "26 saat önce",
    "to": "Trabzon Limanı",
    "toCode": "TRTZX",
    "etaText": "Yarın 12:00",
    "etaSentence": "Yarın saat 12:00'de limana yanaşacak",
    "progressPercent": 44,
    "speedKnots": 14.8,
    "draftMeters": 10.5,
    "distanceRemainingNm": 310,
    "timeRemainingText": "21 saat",
    "waypoints": [
      [
        44.15,
        28.66
      ],
      [
        43.5,
        31
      ],
      [
        42.8,
        34.5
      ],
      [
        42,
        37.5
      ],
      [
        41.01,
        39.73
      ]
    ],
    "currentPos": [
      42.9803,
      33.5987
    ],
    "heading": 104
  },
  "35": {
    "from": "İzmir Alsancak",
    "fromCode": "TRIZM",
    "departureTimeText": "7 saat önce (07:30)",
    "to": "Piraeus (Yunanistan)",
    "toCode": "GRPIR",
    "etaText": "Bugün 19:30",
    "etaSentence": "Bugün saat 19:30'da limana yanaşacak",
    "progressPercent": 70,
    "speedKnots": 14.5,
    "draftMeters": 8.2,
    "distanceRemainingNm": 45,
    "timeRemainingText": "3 saat",
    "waypoints": [
      [
        38.45,
        27.1
      ],
      [
        38.5,
        26.5
      ],
      [
        38.2,
        25.5
      ],
      [
        37.8,
        24.5
      ],
      [
        37.94,
        23.64
      ]
    ],
    "currentPos": [
      37.8769,
      24.6922
    ],
    "heading": 243
  },
  "36": {
    "from": "Cenova (İtalya)",
    "fromCode": "ITGOA",
    "departureTimeText": "28 saat önce",
    "to": "Valetta (Malta)",
    "toCode": "MTMLA",
    "etaText": "Bugün 23:30",
    "etaSentence": "Bugün saat 23:30'da limana yanaşacak",
    "progressPercent": 48,
    "speedKnots": 16.8,
    "draftMeters": 11.8,
    "distanceRemainingNm": 290,
    "timeRemainingText": "17 saat",
    "waypoints": [
      [
        44.4,
        8.92
      ],
      [
        42.5,
        9.8
      ],
      [
        40,
        12
      ],
      [
        38,
        14.2
      ],
      [
        36.5,
        14.8
      ],
      [
        35.89,
        14.51
      ]
    ],
    "currentPos": [
      40.2205,
      11.806
    ],
    "heading": 146
  },
  "37": {
    "from": "Rotterdam Limanı",
    "fromCode": "NLRTM",
    "departureTimeText": "3 gün önce",
    "to": "Port Said (Süveyş)",
    "toCode": "EGPSD",
    "etaText": "4 gün sonra",
    "etaSentence": "4 gün sonra Süveyş Kanalı'na ulaşacak",
    "progressPercent": 55,
    "speedKnots": 18.2,
    "draftMeters": 14.5,
    "distanceRemainingNm": 1420,
    "timeRemainingText": "78 saat",
    "waypoints": [
      [51.95, 4.13],
      [50.50, 0.05],
      [49.20, -4.50],
      [44.50, -9.50],
      [38.50, -10.00],
      [36.00, -6.00],
      [36.20, -2.00],
      [37.00, 5.00],
      [36.50, 15.00],
      [34.50, 24.00],
      [31.80, 31.50],
      [31.26, 32.31]
    ],
    "currentPos": [36.75, 10.20],
    "heading": 105
  },
  "38": {
    "from": "Port Said Limanı",
    "fromCode": "EGPSD",
    "departureTimeText": "12 saat önce",
    "to": "İskenderiye Limanı",
    "toCode": "EGALY",
    "etaText": "Bugün 20:00",
    "etaSentence": "Bugün akşam Nil Deltası açığından İskenderiye'ye yanaşacak",
    "progressPercent": 65,
    "speedKnots": 15.0,
    "draftMeters": 12.0,
    "distanceRemainingNm": 60,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [31.26, 32.31],
      [31.60, 31.80],
      [31.50, 30.80],
      [31.20, 29.88]
    ],
    "currentPos": [31.55, 31.30],
    "heading": 260
  },
  "39": {
    "from": "İskenderiye Limanı",
    "fromCode": "EGALY",
    "departureTimeText": "20 saat önce",
    "to": "Limassol Limanı",
    "toCode": "CYLMS",
    "etaText": "Yarın 09:00",
    "etaSentence": "Yarın sabah Kıbrıs güneyinden Limassol'a varacak",
    "progressPercent": 58,
    "speedKnots": 15.5,
    "draftMeters": 12.5,
    "distanceRemainingNm": 120,
    "timeRemainingText": "8 saat",
    "waypoints": [
      [31.20, 29.88],
      [32.50, 31.00],
      [33.80, 32.50],
      [34.66, 33.04]
    ],
    "currentPos": [33.15, 31.75],
    "heading": 42
  },
  "40": {
    "from": "Limassol Limanı",
    "fromCode": "CYLMS",
    "departureTimeText": "14 saat önce",
    "to": "Hayfa Limanı",
    "toCode": "ILHFA",
    "etaText": "Yarın 06:00",
    "etaSentence": "Yarın sabah Hayfa Körfezi'ne demirleyecek",
    "progressPercent": 70,
    "speedKnots": 15.0,
    "draftMeters": 11.5,
    "distanceRemainingNm": 55,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [34.66, 33.04],
      [34.20, 33.80],
      [33.50, 34.50],
      [32.82, 35.00]
    ],
    "currentPos": [33.30, 34.65],
    "heading": 135
  },
  "41": {
    "from": "Hayfa Limanı",
    "fromCode": "ILHFA",
    "departureTimeText": "6 saat önce",
    "to": "Beyrut Limanı",
    "toCode": "LBBEY",
    "etaText": "Bugün 18:00",
    "etaSentence": "Bugün akşam Lübnan sahili boyunca Beyrut'a yanaşacak",
    "progressPercent": 60,
    "speedKnots": 16.0,
    "draftMeters": 11.0,
    "distanceRemainingNm": 35,
    "timeRemainingText": "2 saat",
    "waypoints": [
      [32.82, 35.00],
      [33.30, 35.10],
      [33.60, 35.40],
      [33.90, 35.52]
    ],
    "currentPos": [33.45, 35.25],
    "heading": 25
  },
  "42": {
    "from": "Beyrut Limanı",
    "fromCode": "LBBEY",
    "departureTimeText": "16 saat önce",
    "to": "İskenderun Limanı",
    "toCode": "TRISK",
    "etaText": "Yarın 10:00",
    "etaSentence": "Yarın sabah İskenderun Körfezi'ne varacak",
    "progressPercent": 62,
    "speedKnots": 15.5,
    "draftMeters": 12.0,
    "distanceRemainingNm": 75,
    "timeRemainingText": "5 saat",
    "waypoints": [
      [33.90, 35.52],
      [34.80, 35.50],
      [35.50, 35.60],
      [36.30, 35.80],
      [36.60, 36.17]
    ],
    "currentPos": [35.90, 35.70],
    "heading": 15
  },
  "43": {
    "from": "İskenderun Limanı",
    "fromCode": "TRISK",
    "departureTimeText": "8 saat önce",
    "to": "Mersin Uluslararası Limanı (MIP)",
    "toCode": "TRMER",
    "etaText": "Bugün 21:00",
    "etaSentence": "Bu gece Mersin açıklarından limana yanaşacak",
    "progressPercent": 68,
    "speedKnots": 14.5,
    "draftMeters": 11.5,
    "distanceRemainingNm": 30,
    "timeRemainingText": "2 saat",
    "waypoints": [
      [36.60, 36.17],
      [36.40, 35.80],
      [36.30, 35.00],
      [36.78, 34.65]
    ],
    "currentPos": [36.45, 35.15],
    "heading": 290
  },
  "44": {
    "from": "Mersin Uluslararası Limanı (MIP)",
    "fromCode": "TRMER",
    "departureTimeText": "18 saat önce",
    "to": "Antalya Port Akdeniz",
    "toCode": "TRANT",
    "etaText": "Yarın 12:00",
    "etaSentence": "Yarın öğle saatlerinde Antalya Körfezi'ne girecek",
    "progressPercent": 55,
    "speedKnots": 15.0,
    "draftMeters": 12.0,
    "distanceRemainingNm": 130,
    "timeRemainingText": "9 saat",
    "waypoints": [
      [36.78, 34.65],
      [36.00, 33.50],
      [35.90, 32.00],
      [36.50, 31.00],
      [36.83, 30.60]
    ],
    "currentPos": [36.10, 31.80],
    "heading": 300
  },
  "45": {
    "from": "Antalya Port Akdeniz",
    "fromCode": "TRANT",
    "departureTimeText": "15 saat önce",
    "to": "Bodrum Kruvaziyer Limanı",
    "toCode": "TRBDM",
    "etaText": "Yarın 08:00",
    "etaSentence": "Yarın sabah Gökova Körfezi üzerinden Bodrum'a yanaşacak",
    "progressPercent": 65,
    "speedKnots": 16.0,
    "draftMeters": 10.5,
    "distanceRemainingNm": 85,
    "timeRemainingText": "5 saat",
    "waypoints": [
      [36.83, 30.60],
      [36.10, 29.80],
      [36.00, 28.50],
      [36.70, 27.80],
      [37.03, 27.43]
    ],
    "currentPos": [36.35, 28.15],
    "heading": 315
  },
  "46": {
    "from": "Bodrum Kruvaziyer Limanı",
    "fromCode": "TRBDM",
    "departureTimeText": "10 saat önce",
    "to": "Nemrut / Aliağa Limanı",
    "toCode": "TRNMP",
    "etaText": "Bugün 23:00",
    "etaSentence": "Bu gece Çandarlı Körfezi'nden Nemrut Limanı'na varacak",
    "progressPercent": 60,
    "speedKnots": 15.5,
    "draftMeters": 11.2,
    "distanceRemainingNm": 65,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [37.03, 27.43],
      [37.30, 27.00],
      [38.00, 26.50],
      [38.60, 26.60],
      [38.78, 26.93]
    ],
    "currentPos": [38.30, 26.55],
    "heading": 10
  },
  "47": {
    "from": "Nemrut / Aliağa Limanı",
    "fromCode": "TRNMP",
    "departureTimeText": "12 saat önce",
    "to": "Çanakkale Kepez Limanı",
    "toCode": "TRCKZ",
    "etaText": "Yarın 04:00",
    "etaSentence": "Gece saatlerinde Çanakkale Boğazı Kepez Rıhtımı'na yanaşacak",
    "progressPercent": 62,
    "speedKnots": 15.0,
    "draftMeters": 11.8,
    "distanceRemainingNm": 50,
    "timeRemainingText": "3 saat",
    "waypoints": [
      [38.78, 26.93],
      [39.30, 26.00],
      [39.80, 25.90],
      [40.05, 26.20],
      [40.10, 26.37]
    ],
    "currentPos": [39.60, 25.92],
    "heading": 350
  },
  "48": {
    "from": "Algeciras Limanı",
    "fromCode": "ESALG",
    "departureTimeText": "4 saat önce",
    "to": "Tanca Med Limanı",
    "toCode": "MAPTM",
    "etaText": "Bugün 16:00",
    "etaSentence": "Cebelitarık Boğazı'nı geçerek Tanca Med'e yanaşacak",
    "progressPercent": 60,
    "speedKnots": 15.0,
    "draftMeters": 12.0,
    "distanceRemainingNm": 15,
    "timeRemainingText": "1 saat",
    "waypoints": [
      [36.13, -5.44],
      [36.00, -5.40],
      [35.89, -5.50]
    ],
    "currentPos": [36.02, -5.42],
    "heading": 200
  },
  "49": {
    "from": "Tanca Med Limanı",
    "fromCode": "MAPTM",
    "departureTimeText": "26 saat önce",
    "to": "Barselona Limanı",
    "toCode": "ESBCN",
    "etaText": "Yarın 14:00",
    "etaSentence": "Yarın öğleden sonra Balear Denizi'nden Barselona'ya yanaşacak",
    "progressPercent": 55,
    "speedKnots": 16.5,
    "draftMeters": 13.0,
    "distanceRemainingNm": 240,
    "timeRemainingText": "15 saat",
    "waypoints": [
      [35.89, -5.50],
      [36.50, -4.00],
      [37.50, -1.00],
      [39.00, 0.50],
      [40.50, 1.50],
      [41.35, 2.16]
    ],
    "currentPos": [38.25, -0.25],
    "heading": 38
  },
  "50": {
    "from": "Barselona Limanı",
    "fromCode": "ESBCN",
    "departureTimeText": "10 saat önce",
    "to": "Marsilya Limanı",
    "toCode": "FRMRS",
    "etaText": "Bugün 23:00",
    "etaSentence": "Bu gece Lion Körfezi'nden Marsilya Limanı'na varacak",
    "progressPercent": 62,
    "speedKnots": 16.5,
    "draftMeters": 12.5,
    "distanceRemainingNm": 80,
    "timeRemainingText": "5 saat",
    "waypoints": [
      [41.35, 2.16],
      [42.20, 3.40],
      [42.90, 4.20],
      [43.34, 5.33]
    ],
    "currentPos": [42.50, 3.75],
    "heading": 48
  },
  "51": {
    "from": "Marsilya Limanı",
    "fromCode": "FRMRS",
    "departureTimeText": "12 saat önce",
    "to": "Cenova Limanı",
    "toCode": "ITGOA",
    "etaText": "Bu gece 02:00",
    "etaSentence": "Gece saatlerinde Ligurya Denizi üzerinden Cenova'ya varacak",
    "progressPercent": 65,
    "speedKnots": 16.0,
    "draftMeters": 12.0,
    "distanceRemainingNm": 70,
    "timeRemainingText": "4 saat",
    "waypoints": [
      [43.34, 5.33],
      [43.00, 6.50],
      [43.50, 7.50],
      [44.10, 8.50],
      [44.40, 8.92]
    ],
    "currentPos": [43.70, 7.80],
    "heading": 55
  },
  "52": {
    "from": "Rotterdam Limanı",
    "fromCode": "NLRTM",
    "departureTimeText": "10 saat önce",
    "to": "Hamburg Limanı",
    "toCode": "DEHAM",
    "etaText": "Bu gece 01:00",
    "etaSentence": "Bu gece Elbe Nehri girişinden Hamburg'a varacak",
    "progressPercent": 65,
    "speedKnots": 15.0,
    "draftMeters": 11.5,
    "distanceRemainingNm": 120,
    "timeRemainingText": "8 saat",
    "waypoints": [
      [51.95, 4.13],
      [52.80, 4.20],
      [53.80, 6.00],
      [54.00, 7.80],
      [53.90, 8.80],
      [53.53, 9.94]
    ],
    "currentPos": [53.85, 7.20],
    "heading": 65
  },
  "53": {
    "from": "Hamburg Limanı",
    "fromCode": "DEHAM",
    "departureTimeText": "22 saat önce",
    "to": "Gdansk Limanı",
    "toCode": "PLGDN",
    "etaText": "Yarın 08:00",
    "etaSentence": "Yarın sabah Baltık Terminali'ne yanaşacak",
    "progressPercent": 55,
    "speedKnots": 16.0,
    "draftMeters": 12.0,
    "distanceRemainingNm": 240,
    "timeRemainingText": "15 saat",
    "waypoints": [
      [53.535, 9.945],
      [53.60, 9.60],
      [53.88, 8.70],
      [54.20, 7.85],
      [55.00, 7.50],
      [56.00, 7.50],
      [57.10, 8.20],
      [57.75, 10.65],
      [56.90, 11.50],
      [56.20, 11.30],
      [55.75, 10.95],
      [55.34, 11.02],
      [54.85, 11.00],
      [54.55, 11.55],
      [54.45, 12.25],
      [54.75, 13.50],
      [55.05, 15.20],
      [54.75, 17.50],
      [54.55, 18.55],
      [54.398, 18.685]
    ],
    "currentPos": [54.75, 13.50],
    "heading": 85
  },
  "54": {
    "from": "Marsilya Limanı",
    "fromCode": "FRMRS",
    "departureTimeText": "28 saat önce",
    "to": "Tanca Med Limanı",
    "toCode": "MAPTM",
    "etaText": "Bu gece 21:00",
    "etaSentence": "Bu gece Cebelitarık Boğazı'nda Tanca'ya varacak",
    "progressPercent": 70,
    "speedKnots": 17.2,
    "draftMeters": 13.2,
    "distanceRemainingNm": 210,
    "timeRemainingText": "12 saat",
    "waypoints": [
      [43.34, 5.33],
      [41.50, 4.50],
      [39.50, 2.50],
      [37.50, -0.50],
      [36.20, -3.50],
      [35.89, -5.50]
    ],
    "currentPos": [36.70, -2.10],
    "heading": 245
  },
  "55": {
    "from": "İskenderiye Limanı",
    "fromCode": "EGALY",
    "departureTimeText": "32 saat önce",
    "to": "İstanbul (Ambarlı)",
    "toCode": "TRIST",
    "etaText": "Yarın 12:00",
    "etaSentence": "Yarın öğle saatlerinde Marmara Denizi'ne girecek",
    "progressPercent": 62,
    "speedKnots": 16.0,
    "draftMeters": 12.5,
    "distanceRemainingNm": 260,
    "timeRemainingText": "16 saat",
    "waypoints": [
      [31.18, 29.87],
      [34.00, 28.50],
      [36.00, 27.50],
      [38.00, 26.20],
      [39.80, 25.80],
      [40.15, 26.40],
      [40.35, 26.65],
      [40.85, 28.30],
      [40.97, 28.69]
    ],
    "currentPos": [39.10, 25.95],
    "heading": 15
  }
};