# bowel
Bowel is a flexible server-object decompiler and resource extractor. Bowel helps to refactor databases for the eternia build system.

## Usage Examples

```shell

bowel dump ../warrior/dist/server-object/westland-warrior.json --root-dir ../warrior --dist-dir ../warrior/dist/ --web-dir ../warrior/docs/ --yaml-db ../warrior/db/


clear; bowel dump ~/Universe/Development/poetry/dist/server-object/furkies-purrkies.json --root-dir ../poetry --image-dir ~/Universe/Development/poetry/src/image/ --cover-images ~/Universe/Development/poetry/src/image/ --audio-dir ~/Universe/Development/poetry/src/audio/ --web-dir ~/Universe/Development/poetry/docs/ --dist-dir ~/Universe/Development/poetry/dist/

```

# TODO

- [x] The new server objects are just .data now, the attachments should be attached to the first record.
- [x] Put In Compiler Mode
