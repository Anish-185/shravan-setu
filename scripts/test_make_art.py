import struct

from make_art import OUT, images


def size(path):
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    i = 2  # JPEG: walk the markers to the frame header (SOF0/SOF2)
    while data[i] == 0xFF:
        marker, length = data[i + 1], struct.unpack(">H", data[i + 2:i + 4])[0]
        if marker in (0xC0, 0xC2):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        i += 2 + length
    raise ValueError(path)


def test_every_image_is_committed_at_its_original_size():
    for name, w, h, _bg, _body in images():
        assert size(OUT / name) == (w, h), name


def test_jpegs_are_jpegs_and_pngs_are_pngs():
    for name, *_ in images():
        assert (OUT / name).read_bytes()[:2] == (b"\xff\xd8" if name.endswith(".jpg") else b"\x89P"), name
