#!/usr/bin/env python3
"""Gera os ícones do RS KITS (PNG 512 + ICO 256) sem dependências (stdlib).

Uso:
    python3 scripts/gen-icon.py --out desktop/electron/assets
"""
import argparse
import math
import os
import struct
import zlib


def sdf_rounded(px, py, cx0, cy0, cx1, cy1, r):
    qx = abs(px - (cx0 + cx1) / 2) - (cx1 - cx0) / 2 + r
    qy = abs(py - (cy0 + cy1) / 2) - (cy1 - cy0) / 2 + r
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) - r


def coverage(d, aa=1.0):
    return max(0.0, min(1.0, 0.5 - d / aa))


def render(size):
    px = [(0.0, 0.0, 0.0, 0.0)] * (size * size)
    S = float(size)
    pad = S * 0.06
    r = S * 0.16

    for y in range(size):
        for x in range(size):
            d = sdf_rounded(x, y, pad, pad, S - pad, S - pad, r)
            a = coverage(d, max(1.0, S / 256))
            if a <= 0:
                continue
            t = y / S
            cr = 0x0F + (0x1E - 0x0F) * t
            cg = 0x17 + (0x29 - 0x17) * t
            cb = 0x2A + (0x3B - 0x2A) * t
            px[y * size + x] = (cr, cg, cb, a)

    # Cinco barras horizontais (tema "kit/podio"), arredondadas.
    bars = [
        (0.14, 0.72, (0xF5, 0xA6, 0x23)),
        (0.27, 0.72, (0xFB, 0xBF, 0x24)),
        (0.40, 0.72, (0xFF, 0x6B, 0x4A)),
        (0.53, 0.64, (0xF8, 0xFA, 0xFC)),
        (0.66, 0.56, (0x94, 0xA3, 0xB8)),
    ]
    for fy_main, fx_main, (r_, g_, b_) in bars:
        # barra principal (comprimento proporcional)
        w_main = S * fx_main
        y0 = S * fy_main
        h = S * (fy_main + 0.07) - y0
        for y in range(size):
            for x in range(size):
                dr = sdf_rounded(x, y, S * 0.20, y0, S * 0.20 + w_main, y0 + h, h / 2)
                a = coverage(dr, max(1.0, S / 320))
                if a <= 0:
                    continue
                ox, oy, ob, oa = px[y * size + x]
                out_a = a + oa * (1 - a)
                out_r = (r_ * a + ox * oa * (1 - a)) / out_a
                out_g = (g_ * a + oy * oa * (1 - a)) / out_a
                out_b = (b_ * a + ob * oa * (1 - a)) / out_a
                px[y * size + x] = (out_r, out_g, out_b, out_a)

    raw = bytearray()
    for i, (r_, g_, b_, a) in enumerate(px):
        raw += bytes((int(r_), int(g_), int(b_), int(a * 255)))
    return bytes(raw)


def png_bytes(raw, size):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    width = height = size
    raw_rows = b"".join(b"\x00" + raw[y * size * 4:(y + 1) * size * 4] for y in range(size))
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw_rows, 9)) + chunk(b"IEND", b"")


def ico_bytes(png_data):
    header = struct.pack("<HHH", 0, 1, 1)
    entry = struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png_data), 6 + 16)
    return header + entry + png_data


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="assets")
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    raw512 = render(512)
    with open(os.path.join(args.out, "icon.png"), "wb") as f:
        f.write(png_bytes(raw512, 512))

    # ICO com PNG 256 embutido (formato aceito pelo electron-builder).
    raw256 = render(256)
    with open(os.path.join(args.out, "icon.ico"), "wb") as f:
        f.write(ico_bytes(png_bytes(raw256, 256)))

    print("ícones gerados em", os.path.abspath(args.out))


if __name__ == "__main__":
    main()