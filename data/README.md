# data/

**Todo lo que hay aquí está en `.gitignore` (excepto este archivo).** Son datos personales: historial completo de escucha e IPs.

## Cómo colocar los datos de una persona

1. Descargar el export de Spotify (Privacidad → Descargar tus datos → **Historial de reproducción ampliado**).
2. Dejar el zip en `data/zips/` como `my_spotify_data_<usuario>.zip`. `levantar.ps1` lo descomprime solo en `data/raw/<usuario>/` (el usuario se normaliza a minúsculas sin espacios):

```
data/raw/
├── gabo/Spotify Extended Streaming History/Streaming_History_Audio_*.json
└── javi/Spotify Extended Streaming History/Streaming_History_Audio_*.json
```

El nombre de la carpeta es el `user_id` en todo el pipeline. Agregar a alguien más = agregar su carpeta y volver a correr el pipeline.

3. Verificar: `uv run python -m pipeline.profile_raw`

## Capas

| Carpeta / bucket | Contenido |
|---|---|
| `data/zips/` | Zips originales tal como los da Spotify |
| `data/raw/` | JSON originales descomprimidos, sin tocar |
| MinIO `bronze` | Copia de raw particionada por usuario |
| MinIO `silver` | Parquet limpio y tipado, sin `ip_addr` |
| MinIO `gold` | Modelo estrella + agregados para el dashboard |
| `data/exports/` | (opcional) gold exportado para un despliegue estático |
