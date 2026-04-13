import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { cuitValidator } from '../../../../shared/validators/cuit.validator';
import { licensePlateValidator } from '../../../../shared/validators/dominio.validator';
import { dateInputValidator } from '../../../../shared/validators/yyyymm.validator';
import {
  VehicleFormComponent,
  VehicleFormGroup,
} from './automotor-form.component';

function createForm(): VehicleFormGroup {
  return new FormGroup({
    licensePlate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, licensePlateValidator()],
    }),
    chassis: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    engine: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    color: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    manufactureDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, dateInputValidator()],
    }),
    ownerCuit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, cuitValidator()],
    }),
  });
}

describe('VehicleFormComponent', () => {
  it('shows validation messages for invalid fields', async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleFormComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(VehicleFormComponent);
    const form = createForm();

    form.patchValue({
      licensePlate: 'ZZ99',
      chassis: '12',
      engine: 'AB',
      color: 'R',
      manufactureDate: '2099-12-01',
      ownerCuit: '20123456780',
    });
    form.markAllAsTouched();

    fixture.componentRef.setInput('title', 'Crear automotor');
    fixture.componentRef.setInput('submitLabel', 'Guardar');
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('errors', []);
    fixture.componentRef.setInput('submitting', false);
    fixture.componentRef.setInput('ownerLookupLoading', false);
    fixture.componentRef.setInput('owner', null);
    fixture.componentRef.setInput('originalOwnerCuit', null);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ingresa un dominio valido');
    expect(text).toContain('Ingresa un CUIT valido');
    expect(text).toContain('Ingresa una fecha valida y no futura');
  });
});
