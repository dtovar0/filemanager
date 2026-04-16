import unittest
import os
import sys

# Add current dir to path to import factory and models
sys.path.append(os.getcwd())

from factory import create_app
from models import db, User, Area, Platform

class TestPlatformAutomation(unittest.TestCase):
    def setUp(self):
        self.app = create_app('dev')
        self.app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "WTF_CSRF_ENABLED": False,
            "SECRET_KEY": "test-key"
        })
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
        
        # Seed
        self.admin = User(name="Test Admin", email="admin@test.com", role="Administrador")
        db.session.add(self.admin)
        self.area = Area(name="TI", description="Tecnología")
        db.session.add(self.area)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_automation_logic(self):
        """Valida la lógica de generación sugerida."""
        # Simulamos creación manual con la lógica que pusimos en admin.py
        p_name = "AWS"
        area = Area.query.filter_by(name="TI").first()
        
        auto_path = os.path.join(area.name, p_name)
        auto_owner = self.admin.name
        
        plat = Platform(
            name=p_name,
            description="Cloud",
            area_id=area.id,
            storage_path=auto_path,
            owner=auto_owner
        )
        db.session.add(plat)
        db.session.commit()
        
        self.assertEqual(plat.storage_path, "TI/AWS")
        self.assertEqual(plat.owner, "Test Admin")
        self.assertFalse(hasattr(plat, 'roles'))

    def test_update_logic(self):
        """Valida que la ruta se actualiza al cambiar nombre o área."""
        area_ti = Area.query.filter_by(name="TI").first()
        area_hr = Area(name="HR", description="Recursos Humanos")
        db.session.add(area_hr)
        db.session.commit()
        
        plat = Platform(name="Portal", description="Sistema de archivos", area_id=area_ti.id, storage_path="TI/Portal")
        db.session.add(plat)
        db.session.commit()
        
        # Simulación de edit_platform en admin.py
        plat.name = "Wiki"
        plat.area_id = area_ti.id
        area = Area.query.get(plat.area_id)
        plat.storage_path = os.path.join(area.name, plat.name)
        db.session.commit()
        
        self.assertEqual(plat.storage_path, "TI/Wiki")
        
        # Cambiar área
        plat.area_id = area_hr.id
        area = Area.query.get(plat.area_id)
        plat.storage_path = os.path.join(area.name, plat.name)
        db.session.commit()
        
        self.assertEqual(plat.storage_path, "HR/Wiki")

    def test_area_users_backref_exists(self):
        """Valida que Area exponga la relación inversa con sus usuarios."""
        self.admin.areas.append(self.area)
        db.session.commit()

        area = Area.query.filter_by(name="TI").first()
        user = User.query.filter_by(email="admin@test.com").first()

        self.assertEqual(len(area.users), 1)
        self.assertEqual(area.users[0].id, user.id)
        self.assertEqual(user.areas[0].id, area.id)

if __name__ == '__main__':
    unittest.main()
