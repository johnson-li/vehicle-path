import sys
from PIL import Image
import cv2
from os import walk
from multiprocessing import Pool

import pyocr
import pyocr.builders

pool = Pool(4)

dirs = ['20180126']
video_dir = '/media/lix16/Elements/DrivingVideos'
output_dir = 'output'

tools = pyocr.get_available_tools()
if len(tools) == 0:
    print("No OCR tool found")
    sys.exit(1)
tool = tools[0]
langs = tool.get_available_languages()
lang = langs[0]


def open_video(dir_name, file_name):
    print('parse video: ' + file_name)
    cap = cv2.VideoCapture(video_dir + '/' + dir_name + '/' + file_name)
    f = open(output_dir + '/' + dir_name + '/' + file_name + '.txt', 'w+')
    while cap.isOpened():
        try:
            _, frame = cap.read()
            cv2_im = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_im = Image.fromarray(cv2_im)
            pil_im = pil_im.crop((200, 1380, 1200, 1440))
            txt = parse(pil_im)
            f.write(txt + '\n')
        except Exception as e:
            print(e)
            break
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    f.close()
    cap.release()


def open_video_run(para):
    try:
        open_video(para[0], para[1])
    except Exception as e:
        print(e)


def parse(pil_im):
    txt = tool.image_to_string(
            pil_im,
            lang=lang,
            builder=pyocr.builders.TextBuilder())
    return txt.strip()


def main():
    pairs = []
    for dir_name in dirs:
        for (dirpath, dirnames, filenames) in walk(video_dir + '/' + dir_name):
            for filename in filenames:
                pairs.append((dir_name, filename))
    pool.map(open_video_run, pairs)


if __name__ == '__main__':
    main()
