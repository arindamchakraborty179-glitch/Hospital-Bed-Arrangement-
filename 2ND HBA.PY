import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
import csv

TOTAL_BEDS = 20

# DATABASE
conn = sqlite3.connect("hospital.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS patients(
name TEXT,
pid TEXT,
ward TEXT,
bed INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
username TEXT,
password TEXT
)
""")

cursor.execute("INSERT OR IGNORE INTO users VALUES('admin','1234')")
conn.commit()


# LOGIN
def login():
    u = user_entry.get()
    p = pass_entry.get()

    cursor.execute("SELECT * FROM users WHERE username=? AND password=?", (u,p))
    result = cursor.fetchone()

    if result:
        login_win.destroy()
        open_dashboard()
    else:
        messagebox.showerror("Error","Invalid login")


# DASHBOARD
def open_dashboard():

    global table, bed_buttons, total_label, free_label, occ_label

    window = tk.Tk()
    window.title("Hospital Dashboard")
    window.geometry("1000x650")
    window.config(bg="#1e1e1e")


    title = tk.Label(window,text="Hospital Bed Management",
    font=("Arial",22,"bold"),bg="#1e1e1e",fg="white")
    title.pack(pady=10)


    # STATS
    stat_frame = tk.Frame(window,bg="#1e1e1e")
    stat_frame.pack()

    total_label = tk.Label(stat_frame,width=20,height=2,bg="#2980b9",fg="white")
    total_label.grid(row=0,column=0,padx=10)

    free_label = tk.Label(stat_frame,width=20,height=2,bg="#27ae60",fg="white")
    free_label.grid(row=0,column=1,padx=10)

    occ_label = tk.Label(stat_frame,width=20,height=2,bg="#c0392b",fg="white")
    occ_label.grid(row=0,column=2,padx=10)


    # INPUT
    input_frame = tk.Frame(window,bg="#1e1e1e")
    input_frame.pack(pady=10)

    tk.Label(input_frame,text="Name",fg="white",bg="#1e1e1e").grid(row=0,column=0)
    entry_name = tk.Entry(input_frame)
    entry_name.grid(row=0,column=1)

    tk.Label(input_frame,text="ID",fg="white",bg="#1e1e1e").grid(row=1,column=0)
    entry_id = tk.Entry(input_frame)
    entry_id.grid(row=1,column=1)

    ward_box = ttk.Combobox(input_frame)
    ward_box["values"] = ("ICU","General","Emergency")
    ward_box.grid(row=2,column=1)


    # ADMIT
    def admit():

        name = entry_name.get()
        pid = entry_id.get()
        ward = ward_box.get()

        cursor.execute("SELECT COUNT(*) FROM patients")
        occupied = cursor.fetchone()[0]

        if occupied >= TOTAL_BEDS:
            messagebox.showerror("Full","No beds available")
            return

        bed = occupied + 1

        cursor.execute("INSERT INTO patients VALUES(?,?,?,?)",(name,pid,ward,bed))
        conn.commit()

        load_table()
        draw_beds()


    # DISCHARGE
    def discharge():

        selected = table.selection()

        if not selected:
            return

        pid = table.item(selected[0])["values"][1]

        cursor.execute("DELETE FROM patients WHERE pid=?",(pid,))
        conn.commit()

        load_table()
        draw_beds()


    btn_frame = tk.Frame(window,bg="#1e1e1e")
    btn_frame.pack()

    tk.Button(btn_frame,text="Admit",bg="#27ae60",fg="white",
    command=admit).grid(row=0,column=0,padx=10)

    tk.Button(btn_frame,text="Discharge",bg="#c0392b",fg="white",
    command=discharge).grid(row=0,column=1,padx=10)


    # TABLE
    columns=("Name","ID","Ward","Bed")

    table = ttk.Treeview(window,columns=columns,show="headings")

    for col in columns:
        table.heading(col,text=col)
        table.column(col,width=200)

    table.pack(pady=10)


    # BED MAP
    bed_frame = tk.Frame(window,bg="#1e1e1e")
    bed_frame.pack(pady=10)

    bed_buttons=[]

    for i in range(TOTAL_BEDS):
        btn=tk.Label(bed_frame,text=str(i+1),width=4,height=2,bg="green")
        btn.grid(row=i//10,column=i%10,padx=5,pady=5)
        bed_buttons.append(btn)


    # EXPORT
    def export():

        cursor.execute("SELECT * FROM patients")
        rows=cursor.fetchall()

        with open("report.csv","w",newline="") as f:
            writer=csv.writer(f)
            writer.writerow(["Name","ID","Ward","Bed"])
            writer.writerows(rows)

        messagebox.showinfo("Export","Report saved")


    tk.Button(window,text="Export Report",command=export).pack(pady=5)


    # LOAD DATA
    def load_table():

        for row in table.get_children():
            table.delete(row)

        cursor.execute("SELECT * FROM patients")
        rows=cursor.fetchall()

        for r in rows:
            table.insert("",tk.END,values=r)

        update_stats()


    def update_stats():

        cursor.execute("SELECT COUNT(*) FROM patients")
        occ=cursor.fetchone()[0]

        free=TOTAL_BEDS-occ

        total_label.config(text=f"Total Beds\n{TOTAL_BEDS}")
        free_label.config(text=f"Free Beds\n{free}")
        occ_label.config(text=f"Occupied\n{occ}")


    def draw_beds():

        for b in bed_buttons:
            b.config(bg="green")

        cursor.execute("SELECT bed FROM patients")
        rows=cursor.fetchall()

        for r in rows:
            bed_buttons[r[0]-1].config(bg="red")


    load_table()
    draw_beds()

    window.mainloop()


# LOGIN WINDOW
login_win = tk.Tk()
login_win.title("Login")
login_win.geometry("300x200")

tk.Label(login_win,text="Username").pack()
user_entry = tk.Entry(login_win)
user_entry.pack()

tk.Label(login_win,text="Password").pack()
pass_entry = tk.Entry(login_win,show="*")
pass_entry.pack()

tk.Button(login_win,text="Login",command=login).pack(pady=10)

login_win.mainloop()