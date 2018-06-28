from os import walk
import re
from pymongo import MongoClient

output_dir = '/home/lix16/Workspace/vehicle-track/output'
dirs = ['105UNSVD', '20180118', '20180126']
client = MongoClient()
db = client['vehicle-db']
collection = db.path_collection


def parse(dirname, filename):
    f = open(output_dir + "/" + dirname + "/" + filename)
    path = []
    last_time = ''
    for line in f.readlines():
        line = line.strip()
        match = re.match('(\d+/\d+/\d+ \d+:\d+:\d+) (\d+\.\d+) (\d+\.\d+) \d+ KM/H', line)
        if match:
            (time_str, longitude, altitude) = match.groups()
            longitude = float(longitude)
            altitude = float(altitude)
            if time_str != last_time:
                path.append((longitude, altitude))
                last_time = time_str
    post = {'file': dirname + '/' + filename, 'path': path}
    collection.insert_one(post)


def main():
    for dirname in dirs:
        for (dirpath, dirnames, filenames) in walk(output_dir + "/" + dirname):
            for filename in filenames:
                parse(dirname, filename)


if __name__ == '__main__':
    main()
