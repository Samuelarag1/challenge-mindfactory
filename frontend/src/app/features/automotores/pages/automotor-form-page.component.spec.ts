import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { convertToParamMap, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { OwnersService } from '../../sujetos/services/sujetos.service';
import { VehiclesService } from '../services/automotores.service';
import { VehicleFormPageComponent } from './automotor-form-page.component';

async function createComponent() {
  const vehiclesService = {
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn(),
    findByLicensePlate: vi.fn(),
  };
  const ownersService = {
    findByCuit: vi.fn().mockReturnValue(of({ cuit: '20123456786', name: 'Juan Perez' })),
  };

  await TestBed.configureTestingModule({
    imports: [VehicleFormPageComponent],
    providers: [
      provideNoopAnimations(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({}) } },
      },
      { provide: VehiclesService, useValue: vehiclesService },
      { provide: OwnersService, useValue: ownersService },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: MatDialog,
        useValue: {
          open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
        },
      },
      { provide: MatSnackBar, useValue: { open: vi.fn() } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(VehicleFormPageComponent);

  return {
    fixture,
    component: fixture.componentInstance,
    vehiclesService,
    ownersService,
  };
}

describe('VehicleFormPageComponent', () => {
  it('surfaces 422 backend errors while saving', async () => {
    const vehiclesService = {
      create: vi.fn().mockReturnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 422,
              error: {
                errors: ['A vehicle already exists with license plate AAA123.'],
              },
            }),
        ),
      ),
      update: vi.fn(),
      findByLicensePlate: vi.fn(),
    };
    const ownersService = {
      findByCuit: vi.fn().mockReturnValue(of({ cuit: '20123456786', name: 'Juan Perez' })),
    };

    await TestBed.configureTestingModule({
      imports: [VehicleFormPageComponent],
      providers: [
        provideNoopAnimations(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
        { provide: VehiclesService, useValue: vehiclesService },
        { provide: OwnersService, useValue: ownersService },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
          },
        },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(VehicleFormPageComponent);
    const component = fixture.componentInstance;

    component.form.patchValue({
      licensePlate: 'AAA123',
      chassis: '8AFZZZ54ZMJ123456',
      engine: 'ABC123456',
      color: 'Rojo',
      manufactureDate: '2018-06-01',
      ownerCuit: '20123456786',
    });

    fixture.detectChanges();
    component.save();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.formErrors()).toEqual([
      'A vehicle already exists with license plate AAA123.',
    ]);
    expect(vehiclesService.create).toHaveBeenCalled();
  });

  it('tracks pending changes against the initial form state', async () => {
    const { component } = await createComponent();

    component.form.patchValue({ licensePlate: 'AAA123' });
    expect(component.hasPendingChanges()).toBe(true);

    component.form.patchValue({ licensePlate: '' });
    expect(component.hasPendingChanges()).toBe(false);
  });

  it('warns before the browser unloads when there are unsaved changes', async () => {
    const { component } = await createComponent();
    const event = {
      preventDefault: vi.fn(),
      returnValue: undefined,
    } as unknown as BeforeUnloadEvent;

    component.form.patchValue({ licensePlate: 'AAA123' });
    component.handleBeforeUnload(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBe('');
  });
});
