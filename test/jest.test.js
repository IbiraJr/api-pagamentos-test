
test('Teste', () => {
    let number = 12;
    expect(number).toBe(12);
});

test('Objetos', () =>{
    const obj = { name: 'John', mail: 'john@gmail.com'};
    expect(obj).toHaveProperty('name');
    expect(obj).toHaveProperty('name', 'John');
});