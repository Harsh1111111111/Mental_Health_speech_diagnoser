import sys
import scipy
import librosa
import numpy as np
import pandas
import json


def split_frequency():
    file_path = sys.argv[1]
    y, sr = librosa.load(file_path)
    # a = librosa.lpc(y, 1)
    a = librosa.lpc(y, order=1)
    b = np.hstack([[0], -1 * a[1:]])
    y_hat = scipy.signal.lfilter(b, [1], y)

    y_har = y_hat * 22050  # Amplify
    freqq = [y for y in y_har if y > 30 and y < 2093]
    # Fundamental Frequency: Men 90-155 Hz, Women 165-255 Hz.
    # Speaking Voice Range: 500 Hz to 2 kHz.

    # freqq = y_ha
    # ls1 = [x.real for x in freq if x.real > 30 and x.real < 2093]
    # ls1 = [x for x in freqq if x > 30 and x < 2093]

    note = librosa.hz_to_note(freqq, cents=True)

    cnt = {}
    for i in note:
        if i in cnt.keys():
            cnt[i] += 1
        else:
            cnt[i] = 1

    ls = []
    # 12 notes
    ls2 = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

    # 6 octaves
    for i in range(1, 7):
        for j in ls2:
            ls.append(j + str(i) + '+0')

    final = {}
    for k in ls:
        if k in cnt.keys():
            num = cnt[k]
            if k[1] == '1' or k[1] == '2' or k[1] == '3' or k[2] == '1' or k[2] == '2' or k[2] == '3':
                num -= 30
            if k[1] == '4' or k[2] == '4':
                num -= 20
            if k[1] == '5' or k[2] == '5':
                num -= 0
            if k[1] == '6' or k[2] == '6':
                if k[0:2] == 'F♯' or k[0] == 'G' or k[0] == 'A' or k[0] == 'B':
                    num -= 40
            if num < 0:
                num = 0
            final.update({k: num})
        else:
            final.update({k: 0})

    fin = {'C': [], 'C♯': [], 'D': [], 'D♯': [], 'E': [], 'F': [],
           'F♯': [], 'G': [], 'G♯': [], 'A': [], 'A♯': [], 'B': []}
    for i in range(1, 7):
        for item in fin.keys():
            fin[item].append(final[item + str(i) + '+0'])

    df1 = pandas.DataFrame(fin, index=[1, 2, 3, 4, 5, 6])

    # Total sum per column:
    df1.loc['Sum', :] = df1.sum(axis=0)

    # Total sum per row:
    df1.loc[:, 'Sum'] = df1.sum(axis=1)
    # print('Successfuly split the Frequencies')
    dic = df1.to_dict("index")

    print(json.dumps(dic, ensure_ascii=False))

    # Low quality audio must be rejected.
    # if(dic[4]['Sum'] < 150 or dic[5]['Sum'] < 100 or dic[6]['Sum'] < 50):
    #     return {'result':'Low quality'}


split_frequency()
