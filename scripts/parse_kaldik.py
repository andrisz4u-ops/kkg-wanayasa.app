import pandas as pd
import json

df = pd.read_excel(r'C:\Users\Andris PC\Downloads\KALDIK SDN 2 Nangerang.xlsm', header=None)

# Legend mapping
legend = {
    'LAS': ('Libur Awal Semester', 'holiday', '#EF4444'),
    'MPLS': ('Masa Pengenalan Lingkungan Sekolah', 'other', '#3B82F6'),
    'HJP': ('Hari Jadi Purwakarta', 'holiday', '#EF4444'),
    'HP': ('Hari Pramuka / Pahlawan', 'other', '#10B981'),
    'LN': ('Libur Nasional', 'holiday', '#EF4444'),
    'PHBI': ('Peringatan Hari Besar Islam', 'holiday', '#EF4444'),
    'HUB': ('Hari Udara Bersih', 'other', '#3B82F6'),
    'HBS': ('Hari Bambu Sedunia', 'other', '#3B82F6'),
    'STS': ('Sumatif Tengah Semester', 'deadline', '#F59E0B'),
    'HKP': ('Hari Kesaktian Pancasila', 'other', '#3B82F6'),
    'HSP': ('Hari Sumpah Pemuda', 'other', '#3B82F6'),
    'HUP': ('Hari Guru Nasional dan HUT PGRI', 'other', '#3B82F6'),
    'HDI': ('Hari Disabilitas Internasional', 'other', '#3B82F6'),
    'HAK': ('Hari Anti Korupsi', 'other', '#3B82F6'),
    'SAS': ('Sumatif Akhir Semester', 'deadline', '#F59E0B'),
    'TPR': ('Tanggal Penetapan Rapot', 'deadline', '#F59E0B'),
    'PR': ('Pembagian Rapot', 'other', '#10B981'),
    'LAR': ('Libur Awal Ramadhan', 'holiday', '#EF4444'),
    'SANLAT': ('Pesantren Kilat', 'training', '#10B981'),
    'L.IDUL FITRI': ('Libur Idul Fitri', 'holiday', '#EF4444'),
    'HAS': ('HAS', 'other', '#3B82F6'),
    'HB': ('Hari Buruh', 'holiday', '#EF4444'),
    'TKA SUSULAN': ('TKA Susulan', 'deadline', '#F59E0B'),
    'ASAJ': ('Asesmen Sumatif Akhir Jenjang', 'deadline', '#F59E0B'),
    'IA': ('IA', 'other', '#3B82F6'),
    'OSN': ('OSN', 'other', '#10B981'),
    'HLH': ('Hari Lingkungan Hidup', 'other', '#3B82F6'),
    'ASAT': ('Asesmen Sumatif Akhir Tahun', 'deadline', '#F59E0B'),
    'LAT': ('Libur Akhir Tahun', 'holiday', '#EF4444'),
    'SIMULASI': ('Simulasi', 'other', '#3B82F6')
}

months = {
    'JULI': (7, 2026),
    'AGUSTUS': (8, 2026),
    'SEPTEMBER': (9, 2026),
    'OKTOBER': (10, 2026),
    'NOVEMBER': (11, 2026),
    'DESEMBER': (12, 2026),
    'JANUARI': (1, 2027),
    'FEBRUARI': (2, 2027),
    'MARET': (3, 2027),
    'APRIL': (4, 2027),
    'MEI': (5, 2027),
    'JUNI': (6, 2027)
}

sql_statements = ["-- Data Kalender Pendidikan SDN 2 Nangerang 2026-2027\n"]

for idx, row in df.iterrows():
    month_name = str(row[0]).strip().upper()
    if month_name in months:
        month_val, year_val = months[month_name]
        for day in range(1, 32):
            val = str(row[day]).strip()
            if val != 'nan' and val != 'X' and val != '':
                date_str = f"{year_val}-{month_val:02d}-{day:02d}"
                # Handle possible multiple events separated by space or newline if any
                if val in legend:
                    title, event_type, color = legend[val]
                else:
                    title, event_type, color = val, 'other', '#3B82F6'
                
                sql = f"INSERT OR IGNORE INTO calendar_events (title, event_type, start_date, is_all_day, color, created_by) VALUES ('{title}', '{event_type}', '{date_str}', 1, '{color}', 1);"
                sql_statements.append(sql)

with open('kaldik_seed.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print("Created kaldik_seed.sql with " + str(len(sql_statements)) + " statements.")
