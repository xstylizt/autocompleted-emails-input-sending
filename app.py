from flask import Flask, render_template, request, jsonify
from flask_mysqldb import MySQL

# Recall the Flask application
app = Flask(__name__)


# Connect MySQL database
mysql = MySQL(app)


# Set configuration with XAAMPP for connecting database

app.config["MYSQL_HOST"] = "localhost"
app.config["MYSQL_USER"] = "root"
app.config["MYSQL_PASSWORD"] = ""
app.config["MYSQL_DB"] = "abs"

# Display main page
@app.route("/")
def index():
    return render_template('index.html')


# Autocompleted suggestion email
@app.route("/emailsearch",methods=["POST"])
def emailsearch():
    searchbox = request.form.get("email")
    cursor = mysql.connection.cursor()
    query = "select email from emails where email LIKE '{}%' order by email".format(searchbox)
    cursor.execute(query)
    result = cursor.fetchall()
    return jsonify(result)


# Insert email into database
@app.route("/insert_email", methods=["POST"])
def insert_current_email():
    data = request.get_json()  
    emails = data.get("emails")

    if emails:
        cursor = mysql.connection.cursor()
        for entry in emails:
            cur_id = entry.get("id")
            email = entry.get("email")
            query = "INSERT INTO current_emails (cur_id, cur_email) VALUES (%s, %s)"
            cursor.execute(query, (cur_id, email))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"status": "success", "message": "Emails inserted successfully!"})
    else:
        return jsonify({"status": "error", "message": "No emails provided!"})


# Retreieve email from database
@app.route("/retrieve_email", methods=["POST"])
def retrieve_inserted_emails():
    cursor = mysql.connection.cursor()
    query = "SELECT cur_email FROM current_emails"
    cursor.execute(query)
    result = cursor.fetchall()
    cursor.close()
    return jsonify(result)

'''
@app.route('/remove_email', methods=['POST'])
def remove_email():
    try:
        data = request.get_json()
        email = data.get("email")
        if email:
            cur = mysql.connection.cursor()
            cur.execute("DELETE FROM current_emails WHERE cur_email = %s", (email,))
            mysql.connection.commit()
            cur.close()
            return jsonify(success=True, message="Email removed successfully.")
        return jsonify(success=False, message="Invalid email.")
    except Exception as e:
        return jsonify(success=False, message=str(e))
/
'''

if __name__ == '__main__':
    app.run(debug = True)
