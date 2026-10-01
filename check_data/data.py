import h5py

# data path
data_path = '/home/wiss/gerkenf/CODE_PROTOTYPE/thinkingearth_prototype/check_data/predictions_2018.h5'

with h5py.File(data_path, 'r') as f:
    def print_structure(name, obj):
        print(name, type(obj).__name__)
    f.visititems(print_structure)
    print(f['fields'])
    print(f['channel'])


#open data
