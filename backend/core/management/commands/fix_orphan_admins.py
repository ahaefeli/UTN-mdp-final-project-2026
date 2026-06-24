from django.core.management.base import BaseCommand, CommandError
from django.db import models
from core.models import User, Club, ClubRegistrationRequest

class Command(BaseCommand):
    help = "Saneamiento de administradores huérfanos sin club asociado"

    def add_arguments(self, parser):
        parser.add_argument(
            '--user_id',
            type=str,
            help='ID de usuario del administrador huérfano a vincular manualmente'
        )
        parser.add_argument(
            '--club_id',
            type=str,
            help='ID del club al cual vincular el administrador manualmente'
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        club_id = options.get('club_id')

        # Manual binding
        if user_id or club_id:
            if not user_id or not club_id:
                raise CommandError("Debe proveer tanto --user_id como --club_id para la vinculación manual.")
            try:
                user = User.objects.get(id=user_id, role='CLUB_ADMIN')
            except User.DoesNotExist:
                raise CommandError(f"No se encontró un usuario CLUB_ADMIN con el ID {user_id}")
            try:
                club = Club.objects.get(id=club_id)
            except Club.DoesNotExist:
                raise CommandError(f"No se encontró un club con el ID {club_id}")

            user.club = club
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Vinculación manual exitosa: Usuario '{user.username}' ahora pertenece al club '{club.name}'."))
            return

        # Automatic heuristic-based binding
        orphans = User.objects.filter(role='CLUB_ADMIN', club__isnull=True)
        total_orphans = orphans.count()
        patched_count = 0

        self.stdout.write(f"Se encontraron {total_orphans} administradores huérfanos.")

        for user in orphans:
            linked = False
            # Heuristic 1: Match with approved ClubRegistrationRequests
            reqs = ClubRegistrationRequest.objects.filter(status='APPROVED').filter(
                models.Q(admin_email=user.email) |
                models.Q(admin_username=user.username) |
                models.Q(admin_email=user.username)
            )
            for req in reqs:
                club = Club.objects.filter(name=req.club_name, organization=req.organization).first()
                if club:
                    user.club = club
                    user.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"Administrador '{user.username}' vinculado heurísticamente al club '{club.name}' mediante solicitud de registro."
                    ))
                    patched_count += 1
                    linked = True
                    break

            if linked:
                continue

            # Heuristic 2: Match directly with Club using email and organization
            club = Club.objects.filter(email=user.email, organization=user.organization).first()
            if club:
                user.club = club
                user.save()
                self.stdout.write(self.style.SUCCESS(
                    f"Administrador '{user.username}' vinculado heurísticamente al club '{club.name}' por coincidencia de email."
                ))
                patched_count += 1
                linked = True
                continue

            self.stdout.write(self.style.WARNING(
                f"No se pudo inferir el club para el administrador '{user.username}' (ID: {user.id}). Requiere vinculación manual."
            ))

        self.stdout.write(self.style.SUCCESS(
            f"Proceso finalizado. Total huérfanos: {total_orphans}, Parcheados exitosamente: {patched_count}."
        ))
