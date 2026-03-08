#!/bin/bash
# docker.sh — Workspace entpacken, Docker-Image bauen, Ansible ausfuehren
# Sourced by install.sh. Requires common.sh.

# --- Preflight: Docker + Tarball ---
preflight_full() {
    check_cmd docker
    [ -f "$TARBALL" ] || die "Tarball nicht gefunden: $TARBALL"
    docker info &>/dev/null || die "Docker laeuft nicht"

    # Tarball-Alter pruefen (Warnung wenn aelter als 1 Stunde)
    local checksum_file
    checksum_file="$(dirname "$TARBALL")/CHECKSUM"
    if [ -f "$checksum_file" ]; then
        local build_time
        build_time=$(awk '{print $3}' "$checksum_file")
        local build_epoch now_epoch age_minutes
        build_epoch=$(date -d "$build_time" +%s 2>/dev/null || echo "0")
        now_epoch=$(date +%s)
        age_minutes=$(( (now_epoch - build_epoch) / 60 ))
        if [ "$age_minutes" -gt 60 ]; then
            warn "Tarball ist $age_minutes Minuten alt (gebaut: $build_time). Neu bauen mit build-installer.sh?"
        fi
    fi
}

# --- Tarball entpacken ---
unpack_workspace() {
    echo ""
    echo "=== Workspace entpacken ==="
    mkdir -p "$SHM_WORKSPACE"
    tar xzf "$TARBALL" -C "$SHM_WORKSPACE"
    echo "OK: $SHM_WORKSPACE"
}

# --- Docker-Image bauen ---
build_docker() {
    echo ""
    echo "=== Docker-Image bauen ==="
    local dockerfile_dir
    # Dockerfile kann im Tarball oder im Workspace sein
    if [ -f "$SHM_WORKSPACE/ansible/Dockerfile" ]; then
        dockerfile_dir="$SHM_WORKSPACE/ansible"
    elif [ -f "$SHM_WORKSPACE/Dockerfile" ]; then
        dockerfile_dir="$SHM_WORKSPACE"
    else
        die "Dockerfile nicht im Tarball gefunden"
    fi
    docker build -t "$DOCKER_IMAGE" "$dockerfile_dir" --quiet
    echo "OK: $DOCKER_IMAGE"
}

# --- Ansible im Docker ausfuehren ---
run_ansible() {
    local playbook="$1"
    shift
    local extra_args=("$@")
    echo ""
    echo "=== Ansible: $playbook ($(date '+%H:%M:%S')) ==="

    # Separates Ansible-Log pro Playbook
    local pb_name
    pb_name=$(basename "$playbook" .yml)
    local ansible_log="$LOG_DIR/ansible-${pb_name}-$(date '+%Y%m%d-%H%M%S').log"
    echo "  Ansible-Log: $ansible_log"

    local ansible_dir="$SHM_WORKSPACE/ansible"
    [ -d "$ansible_dir" ] || ansible_dir="$SHM_WORKSPACE"

    # Portal-Mount vorbereiten
    local portal_mount=()
    local portal_dir="$SHM_WORKSPACE/portal"
    if [ -d "$portal_dir" ]; then
        portal_mount=(-v "$portal_dir:/portal:ro")
    fi

    # Products-Mount vorbereiten (fuer seed-products)
    local products_mount=()
    local products_dir="$SHM_WORKSPACE/products"
    if [ -d "$products_dir" ]; then
        products_mount=(-v "$products_dir:/products:ro")
    fi

    # Packages-Mount vorbereiten (fuer seed-products: shared, app-shared, finanz-shared)
    local packages_mount=()
    local packages_dir="$SHM_WORKSPACE/packages"
    if [ -d "$packages_dir" ]; then
        packages_mount=(-v "$packages_dir:/packages:ro")
    fi

    # Docs-Mount vorbereiten (fuer Governance-Dateien)
    local docs_mount=()
    local docs_dir="$SHM_WORKSPACE/docs"
    if [ -d "$docs_dir" ]; then
        docs_mount=(-v "$docs_dir:/docs:ro")
    fi

    # Scripts-Mount vorbereiten (fuer validate-story-governance.mjs)
    local scripts_mount=()
    local scripts_dir="$SHM_WORKSPACE/scripts"
    if [ -d "$scripts_dir" ]; then
        scripts_mount=(-v "$scripts_dir:/scripts:ro")
    fi

    docker run --rm -it \
        --network host \
        -v "$ansible_dir:/ansible:ro" \
        -v "$SHM_SECRETS/deploy_key:/root/.ssh/codefabrik_deploy:ro" \
        -v "$SHM_SECRETS/deploy_key.pub:/root/.ssh/codefabrik_deploy.pub:ro" \
        -v "$SHM_SECRETS/ci_deploy_key.pub:/root/.ssh/portal_deploy_ci.pub:ro" \
        -v "$SHM_SECRETS/secrets.yml:/root/secrets.yml:ro" \
        -v "$SHM_OUTPUT:/output:rw" \
        "${portal_mount[@]}" \
        "${products_mount[@]}" \
        "${packages_mount[@]}" \
        "${docs_mount[@]}" \
        "${scripts_mount[@]}" \
        "$DOCKER_IMAGE" \
        "$playbook" -e @/root/secrets.yml ${ANSIBLE_VERBOSITY:-} "${extra_args[@]}" \
        2>&1 | tee -a "$ansible_log"

    # Exit-Code des Docker-Containers auswerten (nicht von tee)
    local rc=${PIPESTATUS[0]}

    # Docker schreibt als root — Output-Dateien fuer User lesbar machen
    chmod -R a+r "$SHM_OUTPUT" 2>/dev/null || true

    if [ "$rc" -ne 0 ]; then
        echo ""
        echo "FEHLER: Playbook $playbook fehlgeschlagen (Exit-Code: $rc)"
        echo "  Vollstaendiges Log: $ansible_log"
        echo "  Installer-Log: $LOG_FILE"
        exit "$rc"
    fi
}
