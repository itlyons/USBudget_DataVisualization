import csv
import json

csvfile = open('SuperSimple.csv', 'r')
jsonfile = open('SuperSimple.json', 'w')

fieldnames = ("Discretionary-Mandatory","Spend-Category", "2027_proj", "2019_proj")
reader = csv.DictReader(csvfile, fieldnames)
for row in reader:
    json.dump(row, jsonfile)
    jsonfile.write('\n')